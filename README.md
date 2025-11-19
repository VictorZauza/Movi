# Movi

Aplicativo mobile criado com Expo que permite buscar filmes no The Movie Database (TMDB), favoritar títulos, manter uma lista “Quero ver” e utilizar dados offline com cache em SQLite.

## Tecnologias

- React Native com Expo
- `expo-sqlite` para cache local, favoritos e watchlist
- `fetch` nativo para consumo da API TMDB

## Configuração da TMDB API

1. Crie ou obtenha uma chave em [https://www.themoviedb.org/](https://www.themoviedb.org/).
2. Abra `src/config/tmdbConfig.js`.
3. Substitua o valor `SUA_CHAVE_TMDB_AQUI` pela sua chave real.

```js
export const TMDB_API_KEY = 'COLOQUE_SUA_CHAVE_AQUI';
```

## Como rodar

1. Instale as dependências:

   ```bash
   npm install --legacy-peer-deps
   ```

2. Inicie o app no Expo Go ou emulador:

   ```bash
   npx expo start
   ```

## Estrutura principal

```
movi/
├── App.js                 # Tabs simples (Buscar, Quero ver, Favoritos)
├── src/
│   ├── api/tmdbService.js # Consumo da TMDB
│   ├── config/tmdbConfig.js
│   ├── db/database.js     # Inicialização do SQLite
│   ├── models/movieRepository.js
│   ├── components/
│   │   ├── MovieCard.js
│   │   └── StarRating.js
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── FavoritesScreen.js
│   │   ├── WatchlistScreen.js
│   │   └── MovieDetailModal.js
│   ├── styles/theme.js
│   └── utils/ratings.js
```

## Funcionalidades

- Busca filmes da TMDB (título, data, sinopse e pôster) e exibe a fonte dos dados (online ou cache).
- Salva o resultado da busca no SQLite para uso offline e indica quando o dado veio do cache.
- Permite favoritar filmes com nota personalizada (estrelas).
- Lista “Quero ver” (watchlist) para filmes que o usuário pretende assistir.
- Modal de filtros/ordenação com opções avançadas (ano, nota mínima, idioma, apenas pôster/sinopse).
- Detalhe completo: pôster, sinopse, nota TMDB em estrelas, gêneros, duração, elenco principal e acesso ao trailer.
- Conversão automática da nota TMDB para sistema de estrelas (meia estrela = 1 ponto).
- Tema claro/escuro com alternância manual e detecção automática pelo sistema.
