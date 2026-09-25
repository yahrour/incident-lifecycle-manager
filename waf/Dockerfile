FROM owasp/modsecurity-crs:nginx

COPY default.conf /etc/nginx/templates/conf.d/default.conf.template
COPY modsecurity.conf /etc/nginx/modsecurity/main.conf

RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout /etc/nginx/certs/server.key \
      -out /etc/nginx/certs/server.crt \
      -days 365 \
      -subj "/CN=localhost"