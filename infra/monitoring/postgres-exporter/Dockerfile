FROM quay.io/prometheuscommunity/postgres-exporter AS upstream

FROM alpine:3.21
RUN apk add --no-cache curl jq

COPY --from=upstream /bin/postgres_exporter /bin/postgres_exporter
COPY infra/vault/vault-fetch.sh /usr/local/bin/vault-fetch.sh
COPY infra/monitoring/postgres-exporter/entrypoint.sh /usr/local/bin/vault-entrypoint.sh
RUN chmod +x /usr/local/bin/vault-entrypoint.sh /usr/local/bin/vault-fetch.sh

EXPOSE 9187
USER 65534:65534
ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
