import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { useAuthText } from '../text';
import { EyeIcon, TickIcon } from './icons';

// Поле формы входа: подпись, иконка, галочка, когда всё верно, и сообщение под полем.

export type FieldState = 'idle' | 'valid' | 'error';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  ref?: Ref<HTMLInputElement>;
  label: string;
  icon: ReactNode;
  state: FieldState;
  /** Ошибка (красным) или подсказка (голубым), если поле верное. */
  message?: ReactNode;
  /** Кнопка справа в поле (глазик) — вместо галочки. */
  action?: ReactNode;
  below?: ReactNode;
}

export function Field({ id, ref, label, icon, state, message, action, below, ...input }: FieldProps) {
  const msgId = `${id}-msg`;
  return (
    <div className={`au-field is-${state}`}>
      <label htmlFor={id}>{label}</label>
      <div className="au-control">
        <span className="au-lead">{icon}</span>
        <input id={id} ref={ref} aria-invalid={state === 'error' || undefined} aria-describedby={message ? msgId : undefined} {...input} />
        {action ?? (
          <span className="au-tick" aria-hidden="true">
            <TickIcon />
          </span>
        )}
      </div>
      {below}
      <p id={msgId} className={`au-msg${state === 'error' ? ' is-error' : message ? ' is-info' : ''}`} aria-live="polite">
        {message}
      </p>
    </div>
  );
}

/** Поле пароля с глазиком и предупреждением о Caps Lock. onPeek — мишка подглядывает, когда пароль виден. */
export function PasswordField(props: Omit<FieldProps, 'action' | 'type'> & { onPeek(show: boolean): void }) {
  const text = useAuthText();
  const { onPeek, below, onKeyUp, ...rest } = props;
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const toggle = () => {
    setShow(!show);
    onPeek(!show);
    document.getElementById(props.id)?.focus();
  };
  return (
    <Field
      {...rest}
      type={show ? 'text' : 'password'}
      onKeyUp={(e) => {
        setCaps(e.getModifierState('CapsLock'));
        onKeyUp?.(e);
      }}
      action={
        <button type="button" className="au-eye" onClick={toggle} aria-label={show ? text.hide : text.show} aria-pressed={show}>
          <EyeIcon off={show} />
        </button>
      }
      below={
        <>
          {below}
          {caps && <p className="au-caps">{text.caps}</p>}
        </>
      }
    />
  );
}
