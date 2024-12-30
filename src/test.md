---
toc: false
sidebar: false
header: false
footer: false
pager: false

sql:
  establecimientos: ./NEM_PERCENTILES_AGGREGATED.parquet
  
---

```sql id=establecimientos
SELECT * 
FROM establecimientos
```

# Matrícula en carreras universitarias según establecimiento de egreso

## Introducción

Este análisis ofrece una exploración inicial de las decisiones educativas de los egresados de Educación Media en Chile: ¿qué carreras eligen, en qué instituciones se matriculan y cuántos estudiantes persisten o cambian de rumbo académico?

Se trata de un análisis descriptivo que busca visualizar patrones generales, sin profundizar en explicaciones o factores causales.

En esta primera etapa, me he concentrado en los estudiantes que egresaron de establecimientos de Educación Media para jóvenes en 2014, y he analizado los registros de matrícula en carreras profesionales de pregrado en universidades para describir continuidad o cambio de carrera.  

Puedes explorar los datos (anónimos) seleccionando un establecimiento específico:

```js
const regionSeleccionada = (() =>{
  const options = _.chain([...establecimientos])
    .groupBy((d) => d.COD_REG_RBD)
    .map((items, key) => ({
      items: items,
      region: key,
      orden: ordenRegiones[key],
      numeroEstudiantes: items.reduce(
        (memo, d) => memo + d.numeroEstudiantes,
        0
      )
    }))
    .filter((d) => d.region !== "null")
    .sortBy((d) => d.orden)
    .value();

  return view(Inputs.select(options, {
    format: (d) =>
      `${aliasRegiones[d.region]} (${d.numeroEstudiantes} estudiantes)`,
      label:"Región",
      value: _.sample(options)
  }));
})()
```

```js
const comunaSeleccionada = (() => {
  const options = _.chain([...establecimientos])
    .filter((d) => d.COD_REG_RBD == regionSeleccionada.region)
    .groupBy((d) => d.NOM_COM_RBD)
    .map((items, key) => ({
      items: items,
      comuna: key,
      numeroEstudiantes: items.reduce(
        (memo, d) => memo + d.numeroEstudiantes,
        0
      )
    }))
    .filter((d) => d.comuna !== "null")
    .sortBy((d) => d.comuna)
    .value();

  return view(Inputs.select(options, {
    format: (d) => `${d.comuna} (${d.numeroEstudiantes} estudiantes)`,
    label:"Comuna",
    value: _.sample(options)
  }));
})()
```

```js
const establecimientoSeleccionado = (() =>{
  const options = _.chain([...establecimientos])
    .filter((d) => d.NOM_COM_RBD == comunaSeleccionada.comuna)
    .filter((d) => d.numeroEstudiantes > 20)
    .sortBy((d) => d.NOM_RBD)
    .value();

  return view(Inputs.select(options, {
    format: (d) => `${d.NOM_RBD} (${d.numeroEstudiantes} estudiantes)`,
    label:"Establecimiento",
    value: _.sample(options)
  }));
})()
```


```js
const rbd = 8485

const url = `http://127.0.0.1:3000/establecimiento/${establecimientoSeleccionado.RBD}`
```

```js
html`<iframe scrolling="yes" src=${url} width="100%" height="100%"></iframe>`
```



```js
const aliasDependencia = ({
  1: "Municipal",
  2: "Particular Subvencionado",
  3: "Particular Pagado",
  4: "Adm. Delegada",
  5: "Servicio Local"
})
```

```js
const aliasRegiones = ({
  15: "De Arica y Parinacota",
  1: "De Tarapacá",
  2: "De Antofagasta",
  3: "De Atacama",
  4: "De Coquimbo",
  5: "De Valparaíso",
  13: "Metropolitana de Santiago",
  6: "Del Libertador B. O'Higgins",
  7: "Del Maule",
  16: "De Ñuble",
  8: "Del Bíobío",
  9: "De La Araucanía",
  14: "De Los Ríos",
  10: "De Los Lagos",
  11: "De Aisén del Gral. C. Ibáñez del Campo",
  12: "De Magallanes y de La Antártica Chilena"
})

const ordenRegiones = ({
  15: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  13: 6,
  6: 7,
  7: 8,
  16:9,
  8: 10,
  9: 11,
  14: 12,
  10: 13,
  11: 14,
  12: 15
})
```
