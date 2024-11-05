FROM node:alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build --prod

FROM nginx:alpine
COPY --from=build /app/dist/arbitrage-graphs/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY certs/dev_localhost.pem /etc/ssl/certs/dev_localhost.pem
COPY certs/dev_localhost.key /etc/ssl/private/dev_localhost.key

RUN chmod 600 /etc/ssl/private/dev_localhost.key

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
