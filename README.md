# Movi – Guia do Aplicativo

Movi é um app mobile (Expo/React Native) para descobrir, favoritar e gerenciar filmes, com suporte offline usando SQLite e dados da TMDB. Ele foi pensado para entregar uma experiência de streaming: carrosséis, destaques, recomendações, histórico, avaliações e listas pessoais.

## Sumário
- Contexto e objetivo
- Tecnologias
- Como rodar localmente
- Como usar
- Principais funcionalidades
- Recursos visuais (screenshots)

## Contexto e objetivo
Movi resolve dois pontos: descobrir bons filmes de forma visual e manter tudo salvo localmente (favoritos, assistidos, comentários, humor, notas) mesmo offline. Ele usa a API da TMDB para dados oficiais e o SQLite para persistência local.

## Tecnologias
- Expo + React Native
- SQLite (expo-sqlite)
- TMDB API (fetch)
- React Native Animated para transições
- react-native-svg para a logo/iconografia

## Como rodar localmente
1) Instale dependências  
```bash
npm install
```

2) Configure a chave TMDB  
Edite `src/config/tmdbConfig.js` e coloque sua chave em `TMDB_API_KEY`.  

3) Inicie o projeto  
```bash
npx expo start
```

4) Abra no emulador ou Expo Go (Android/iOS).

## Como usar
- Buscar filmes: digite o título e toque em “Buscar”; use filtros/ordenação para refinar.
- Destaques e carrosséis: navegue pelos carrosséis “populares da semana”, “em alta no Brasil” e recomendações baseadas nos seus favoritos.
- “Me surpreenda”: sugere um filme aleatório com nota ≥7 alinhado aos gêneros que você mais assiste.
- Detalhes do filme: veja trailer, provedores “Onde assistir”, extras de vídeo, notas, elenco, sinopse e coleções.
- Avaliar e comentar: marque como assistido, defina humor, deixe nota e comentário; tudo salvo no SQLite.
- Favoritos / Quero ver / Assistidos: gerencie suas listas em “Minha lista”.
- Offline/cache: quando sem rede, o app indica que os dados vieram do cache.
- Compartilhar: envie detalhes ou card social com pôster, nota e comentário.

## Principais funcionalidades
- Busca com histórico e cache offline
- Carrosséis de destaque, populares, recomendações
- “Me surpreenda” (aleatório filtrado por gênero/nota ≥7)
- Favoritos, Quero ver, Assistidos com rating, humor e diário
- Recomendações baseadas nos seus favoritos
- “Onde assistir” (providers TMDB: streaming, aluguel, compra, gratuito)
- Extras de vídeo (teasers, entrevistas, BTS)
- Mode de exibição compacta/suprimida e ícones em toda navegação
- Compartilhamento e card social via share
- Estatísticas do usuário (favoritos, assistidos, nota média, gênero/ano mais assistido, filme mais avaliado)

## Recursos visuais (screenshots)
Adicione suas capturas na pasta `docs/screens` (sugestão) e referencie-as aqui:
- Home / busca: `![Home](docs/screens/home.png)`
- Em alta: `![Em alta](docs/screens/top.png)`
- Minha lista: `![Minha lista](docs/screens/library.png)`
- Perfil / estatísticas: `![Perfil](docs/screens/profile.png)`

> Dica: use as imagens fornecidas no enunciado como referência ou salve seus próprios screenshots para manter o README sempre atualizado.

