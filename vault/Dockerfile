FROM hashicorp/vault:1.18

RUN apk add --no-cache jq

COPY init.sh /usr/local/bin/init.sh
COPY policy.hcl /usr/local/bin/policy.hcl

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/usr/local/bin/init.sh"]
