FROM hashicorp/vault:1.18

RUN apk add --no-cache jq

ENV VAULT_ADDR=http://127.0.0.1:8200

COPY config.hcl /vault/config/config.hcl
COPY init.sh /usr/local/bin/init.sh
COPY policies/ /usr/local/bin/policies/

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/usr/local/bin/init.sh"]
