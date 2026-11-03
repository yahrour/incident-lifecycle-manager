FROM postgres:18-alpine

RUN apk add bash

WORKDIR /scripts

COPY ./db.backup.sh ./
COPY ./entrypoint.sh ./

RUN chmod +x ./db.backup.sh ./entrypoint.sh

ENTRYPOINT ["/scripts/entrypoint.sh"]
