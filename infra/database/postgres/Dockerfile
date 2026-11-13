FROM postgres:18

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl jq \
    && rm -rf /var/lib/apt/lists/*

COPY infra/vault/vault-fetch.sh /usr/local/bin/vault-fetch.sh
COPY infra/database/postgres/entrypoint.sh /usr/local/bin/vault-entrypoint.sh

RUN chmod +x /usr/local/bin/vault-entrypoint.sh /usr/local/bin/vault-fetch.sh

ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
CMD ["postgres"]
