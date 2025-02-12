# Usando a imagem oficial do Bun
FROM oven/bun:1

# Definindo o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copiando os arquivos do projeto
COPY . .

# Instalando as dependências
RUN bun install

# Expondo a porta, se necessário
EXPOSE 3000

# Rodando o bot
CMD ["bun", "run", "index.js"]
