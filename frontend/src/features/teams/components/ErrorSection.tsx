export function ErrorSection({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <ul
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive "
    >
      {errors.map((error) => (
        <li key={error} className="before:content-['•'] before:mr-1">
          {error}
        </li>
      ))}
    </ul>
  );
}
