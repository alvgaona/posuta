# posuta

Research posters for the web and for print. Write a poster in MDX, deploy it as a static site on
any free host, and export a vector PDF at whatever size the conference asks for.

```sh
pnpm create posuta my-poster
cd my-poster && pnpm install && pnpm dev
```

Documentation: [`apps/web`](apps/web) (`pnpm docs`).

## Develop

```sh
pnpm install
pnpm dev     # the starter poster in template/ at http://localhost:4321
pnpm test
pnpm docs    # the documentation site
```

## License

MIT
