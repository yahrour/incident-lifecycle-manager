FROM quay.io/prometheuscommunity/postgres-exporter AS upstream

FROM alpine:3.21
RUN apk add --no-cache curl jq

ENV POSTGRES_HOST=postgres \
  POSTGRES_PORT=5432 \
  POSTGRES_SCRAPE_DB=postgres
COPY --from=upstream /bin/postgres_exporter /bin/postgres_exporter
COPY infra/vault/vault-fetch.sh /usr/local/bin/vault-fetch.sh
COPY infra/monitoring/postgres-exporter/entrypoint.sh /usr/local/bin/vault-entrypoint.sh
RUN chmod +x /usr/local/bin/vault-entrypoint.sh /usr/local/bin/vault-fetch.sh

USER 65534:65534
ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
