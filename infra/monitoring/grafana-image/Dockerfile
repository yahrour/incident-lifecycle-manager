FROM grafana/grafana:13.2.2

USER root
RUN apk add --no-cache curl jq

COPY infra/vault/vault-fetch.sh /usr/local/bin/vault-fetch.sh
COPY infra/monitoring/grafana-image/entrypoint.sh /usr/local/bin/vault-entrypoint.sh
RUN chmod +x /usr/local/bin/vault-entrypoint.sh /usr/local/bin/vault-fetch.sh

USER grafana
ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
