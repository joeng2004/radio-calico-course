# ---- deps stage: install + compile native modules ----
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- dev target ----
FROM node:20-alpine AS dev
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DB_PATH=/data/dev.db
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- prod target ----
FROM node:20-alpine AS prod
RUN apk add --no-cache libstdc++
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DB_PATH=/data/dev.db
EXPOSE 3000
CMD ["npm", "start"]
