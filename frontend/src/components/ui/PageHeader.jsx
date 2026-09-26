import {
  Command
} from "lucide-react";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action
}) {
  return (
    <header className="page-header">
      <div>
        <div className="page-eyebrow">
          <Command
            size={13}
          />
          {eyebrow}
        </div>

        <h1>{title}</h1>

        <p>{subtitle}</p>
      </div>

      {action && (
        <div className="page-header__action">
          {action}
        </div>
      )}
    </header>
  );
}
