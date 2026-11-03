"""Build genuine SVG paths from the approved illustration sources.

Local dependencies: python -m pip install --target visual-lab/.tools/python vtracer==0.6.15 pillow==13.0.0
Usage: python visual-lab/vectorize-v3.py visual-lab/vector-jobs-v3.json
The JSON job list is the reproducible source of input/output mappings.
"""
import concurrent.futures
import json
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / '.tools' / 'python'))
import vtracer
from PIL import Image

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)

def scoped(relative):
    path = (ROOT / relative).resolve()
    path.relative_to(ROOT)
    return path

def convert(job):
    started = time.monotonic()
    source, target = scoped(job['source']), scoped(job['path'])
    if target.suffix != '.svg' or '-v3' not in target.stem:
        raise ValueError('Only explicitly versioned v3 SVG outputs are allowed')
    width, height = Image.open(source).size
    lineart = job.get('category') == 'coloring-pages'
    options = dict(colormode='binary' if lineart else 'color', hierarchical='stacked',
                   mode='spline', filter_speckle=2 if lineart else 6,
                   color_precision=6, layer_difference=12, corner_threshold=60,
                   length_threshold=2.5, max_iterations=10, splice_threshold=45,
                   path_precision=2)
    data = vtracer.convert_raw_image_to_svg(source.read_bytes(), img_format='png', **options)
    svg = ET.fromstring(data)
    svg.set('viewBox', f'0 0 {width} {height}')
    svg.set('role', 'img')
    svg.set('aria-labelledby', 'art-title art-description')
    title = ET.Element(f'{{{NS}}}title', {'id': 'art-title'})
    title.text = job['title']
    description = ET.Element(f'{{{NS}}}desc', {'id': 'art-description'})
    description.text = ('Подробная контурная раскраска.' if lineart else 'Детальная цветная векторизация иллюстрации.') + ' Настоящие SVG-контуры; без встроенного растра.'
    svg.insert(0, title)
    svg.insert(1, description)
    if lineart:
        svg.insert(2, ET.Element(f'{{{NS}}}rect', {'width': str(width), 'height': str(height), 'fill': '#fff'}))
    if any(node.tag.rsplit('}', 1)[-1] in ('image', 'foreignObject', 'script') for node in svg.iter()):
        raise ValueError('Non-vector content in generated SVG')
    target.parent.mkdir(parents=True, exist_ok=True)
    ET.indent(svg, space='  ')
    ET.ElementTree(svg).write(target, encoding='utf-8', xml_declaration=True)
    result = dict(job, width=width, height=height, bytes=target.stat().st_size,
                  paths=sum(node.tag == f'{{{NS}}}path' for node in svg.iter()),
                  seconds=round(time.monotonic() - started, 2))
    print(json.dumps(result, ensure_ascii=True), flush=True)
    return result

if __name__ == '__main__':
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(convert, jobs))
