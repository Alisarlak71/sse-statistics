FROM ghcr.io/getimages/ubuntu:18.04
USER root
ENV APP_DIR="/app"

WORKDIR ${APP_DIR}
RUN apt-get update && apt-get -y install curl software-properties-common
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get -y install nodejs
COPY ["package.json", "package-lock.json*", "./"] 
RUN npm install 
COPY . .
EXPOSE 3000

CMD [ "node", "index.js"]