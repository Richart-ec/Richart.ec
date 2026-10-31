# Brand notes — Sony Ecuador · Sony Store Scala Shopping (Cumbayá)

Investigación hecha el **31/10/2026** (UTC 11:07). Todo lo que aparece en el spot sale de las
fuentes listadas aquí. Capturas y JSON crudos en `store-capture/`, `api/` y `css/`.

## Colores

| Uso en el spot | HEX | Fuente exacta |
|---|---|---|
| Fondo | `#000000` | token VTEX `bg-base--inverted`; barra superior de store.sony.com.ec |
| Texto / logos | `#FFFFFF` | token `bg-base`; logo SONY de scene7 (`fill="#FFFFFF"`) |
| Títulos (referencia) | `#2F353D` | `.pasonyb2cqa-general-apps-0-x-banner-eyebrow-gwx` (estilo computado) |
| Cuerpo (referencia) | `#3F3F40` | tokens `near-black` / `c-on-base` (`pasonyb2cqa.theme@5.0.271`) |
| Secundario / nota al pie | `#83838F` | color de texto más usado en la home (estilos computados) |
| Secundario oscuro | `#54545F` | `.banner-description-gwx` |
| Subtítulos y "1/2" | `#CACBCC` | tokens `silver` / `muted-3` |
| Nivel 2/2 (naranja) | `#F25529` | token `bg-action-primary` |
| Nivel 1/2 (azul) | `#2D75C7` | `.banner-cta-button-gwx` (botón de banner) |
| Links (referencia) | `#4572ED` | breadcrumbs / `lineAnchor` |
| Emblema G MASTER | `#CD4902` | medido en el banner de /lentes-gm: mediana del emblema `#CC4802` (JPEG) |
| α Alpha | `#E94E09` | `fill` del SVG de Wikimedia Commons |
| Scala Shopping | `#69133A` | ícono oficial 2023 (`cropped-scalapng.png`); el logo rojo 2018 es `#7C183E` y la web usa `#831A3B` |

## Tipografía

El sitio usa **SST W01** (Light 300, Roman 400, Medium 500, Bold 700), propietaria de Sony.
Se usa **Roboto** (`@remotion/google-fonts/Roboto`, 300/400/500/700) por pedido del brief.
Comparación medible contra SST renderizada en la propia tienda (superposición de glifos IoU,
4 pesos × 5 frases, normalizado por altura de mayúscula; `font-compare.json`, `font-compare-sheet.png`):

| Fuente | IoU vs SST | ancho | tinta |
|---|---:|---:|---:|
| Noto Sans | 0.424 | 1.013 | 1.033 |
| Open Sans | 0.400 | 1.003 | 0.967 |
| Hind | 0.379 | 0.983 | 1.060 |
| **Roboto** | **0.330** | 0.971 | 1.050 |
| Source Sans 3 | 0.319 | 0.976 | 0.998 |
| Figtree | 0.308 | 1.003 | 1.033 |
| Inter | 0.258 | 1.027 | 1.105 |
| Mukta | 0.254 | 1.024 | 1.193 |

Si se busca el máximo parecido a SST, Noto Sans es la más cercana (cambio de una línea en `src/lib/brand.ts`).

## Tono

Tuteo, frases cortas, CTA con verbo al inicio ("Aprovecha ahora", "Encuentra tu lente ideal",
"Visita nuestras tiendas"), kickers en MAYÚSCULAS ("ENCUENTRA LA TV IDEAL PARA TI").

## Productos (API pública VTEX)

- Ranking cámaras: `/api/catalog_system/pub/products/search/?fq=C:/24/&O=OrderByTopSaleDESC&_from=0&_to=40`
  → **n.º 1 ILCE-6400K** (α6400 + SELP16502). `api/cameras-topsale.json`.
- Cámaras de lentes intercambiables `C:/24/26/` → ILCE-7M5 (a7 V solo body) n.º 3, primera full-frame.
- Lentes `C:/24/28/` (la categoría 28 cuelga de 24; `C:/28/` sola devuelve 0) → SEL2470GM2 n.º 3,
  **primer G Master** del ranking. `api/lenses-topsale.json`.
- Nota al pie del spot: "*N.º 1 en ventas en la categoría Cámaras de store.sony.com.ec, al 31/10/2026."
- Cifras mostradas (fichas oficiales): **33,0 MP** efectivos (ILCE-7M5) y **695 g** (SEL2470GM2).
  Coincidencia: la a7 V también pesa aprox. 695 g con batería; el callout está sobre el lente.
- Láminas del diafragma: SELP16502 = **7** ("unidad de apertura circular de 7 láminas");
  SEL2470GM2 = **11** ("nueva unidad de apertura de 11 láminas"). Por eso el diafragma del spot
  cierra con 7 y reabre con 11 (el "salto").
- Imágenes: `ecsonyb2c.vteximg.com.br` — ILCE-6400K-06-Front, GENBA_ILCE-7M5_01_Main_SSO,
  SEL2470GM2-1-Main-A (resolución nativa ~1000 px; las variantes 2000/3000 son reescalados).

## Tienda

store.sony.com.ec/tiendas-fisicas: "SONY STORE SCALA SHOPPING MALL — Av. Oswaldo Guayasamín,
Km. 12.5, Quito, Pichincha (Segunda planta alta, local L321)". En el video solo va
"Scala Shopping, Cumbayá" (sin horarios, teléfono, precios ni promociones).

## Logos (en `public/brand/`)

| Archivo | Origen y tratamiento |
|---|---|
| `sony-logo.svg` + `src/lib/sonyLogoPaths.ts` | SVG oficial `sony.scene7.com/is/content/sonyglobalsolutions/sony-logo?$S7Product$`; viewBox recortado a `0.979 0.549 500 88.03`; 4 paths (S, O, N, Y) |
| `gmaster-logo-dark.svg` / `-light.svg` / `gmaster-emblem.svg` | **Reconstruido**: no hay vector público. Emblema geométrico ajustado al banner de /lentes-gm (alto 94,03 px, ancho 136,97 al centro y 121,96 arriba/abajo, laterales parabólicos como Bézier cuadráticas exactas, radio 1,2; error 0,1 px). G y MASTER trazadas con potrace desde mapas ×12. IoU contra el banner: emblema 0,987, G 0,973 |
| `sony-alpha.svg` / `-white.svg` | Wikimedia Commons, File:Sony_Alpha_logo.svg (PD-textlogo, marca registrada de Sony) |
| `a7v-logotype-white.png` | Recorte del logotipo "α7 V" de la imagen oficial GENBA_ILCE-7M5_01_Main_Awards_2000x2000px, pasado a blanco con alfa |
| `scala-shopping.png` | Ícono oficial 2023 de scalashopping.com (512 px), borde des-mezclado. **Conviene pedirle a Scala el vector** para la versión final |

## Recortes de producto (`public/products/`, `tools/cutout_products.py`)

Fondo blanco puro (255) → alfa por flood-fill desde los bordes (scipy), agujeros de las orejetas
de la correa, apertura morfológica contra espículas JPEG, des-mezcla del halo blanco en una banda
de 3 px y metal brillante con alfa acotado. Revisado sobre gris oscuro y negro.

## Referencias de video

Ver `youtube/NOTES.md` (YouTube bloquea la reproducción desde la nube; se usaron sus fotogramas públicos).

## Derechos

Marcas, logos y fotos son de Sony y de Scala Shopping. Este spot es una propuesta: antes de
publicarlo hace falta la aprobación de ambas marcas.
