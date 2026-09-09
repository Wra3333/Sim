FROM node:22-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (только production)
RUN npm ci --only=production

# Копируем весь код
COPY . .

# Создаем папку для загрузок
RUN mkdir -p uploads

# Открываем порт API
EXPOSE 3000

# Запускаем Moleculer через moleculer-runner
CMD ["npm", "start"]