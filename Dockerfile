FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

EXPOSE 9005

RUN  npm i -g firebase-tools
RUN  npm install

# Copy local code to the container
COPY . .

# Start the service in the container
# The build was directly included in this one
RUN firebase login:ci
CMD npm run build && npm run serve