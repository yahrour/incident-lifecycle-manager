export function ServicesPreview({ services }: { services: string[] }) {
  return (
    <div className="flex-1 rounded-lg border border-border/50 bg-card">
      <h2 className="border-b border-border/50 px-4 py-3 text-sm font-medium text-foreground">
        Services
      </h2>

      {services.length === 0 ? (
        <p className="px-4 py-3 text-center text-sm text-muted-foreground">
          No services owned by this team.
        </p>
      ) : (
        <ul className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-2">
          {services.map((service) => (
            <li
              key={service}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span className="size-1.5 rounded-full bg-muted-foreground shrink-0" />
              {service}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
