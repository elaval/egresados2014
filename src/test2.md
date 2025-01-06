---
toc: false
sidebar: false
header: false
footer: false
pager: false

sql:
  comunas: ./data/comunas.json
  establecimientos: ../NEM_PERCENTILES_AGGREGATED.parquet

---

```js
import {analisisTrayectorias} from "./components/analisisTrayectorias.js";
import {SankeyChart} from "./components/SankeyChart.js";
```


```sql id=comunas
SELECT *
FROM comunas
```

```sql id=establecimientos
SELECT * 
FROM establecimientos
```

# Matrícula en carreras de Educación Superior según comuna de egreso

<!-- Description of the analysis -->
Análisis en base a datos de jóvenes egresados de Educación Media en 2014 y sus respectivos registros de matrícula en Educación Superior entre 2015 y 2024.


```js
// Define the selected region based on the available data
const regionSeleccionada = (() =>{
  const options = _.chain([...comunas])
    .groupBy((d) => d.cod_region)
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
         // value: options.find(d => d.region == targetRegion)
  }));
})()
```

```js
// Define the selected comuna based on the selected region
const comunaSeleccionada = (() => {
  const options = _.chain([...comunas])
    .filter((d) => d.cod_region == regionSeleccionada.region)
    .sortBy((d) => d.comuna)
    .value();

  return view(Inputs.select(options, {
    format: (d) => `${d.comuna} (${d.numeroEstudiantes} estudiantes)`,
    label:"Comuna",
    value: _.chain(options).maxBy(d => d.numeroEstudiantes).value()
  }));
})()
```


<div class="card">



## ${comunaSeleccionada.comuna}
## Resumen General
En ${comunaSeleccionada.comuna}, egresaron ${
    matriculaComuna.estudiantesEgresados
  } estudiantes en 2014.

Entre 2015 y 2024:
* ${matriculaComuna.matriculadosES} (${d3.format(".1%")(matriculaComuna.matriculadosES/matriculaComuna.estudiantesEgresados)}) se matricularon en alguna carrera de Educación Superior.

```js
// Plot the bar chart for the selected comuna
(() => {
  return Plot.plot({
    marginTop:30,
    marks: [
      Plot.barX([matriculaComuna.estudiantesEgresados], {
        x: d=>d,
        fill: "lightgray"
      }),
     Plot.barX([matriculaComuna.matriculadosES], {
        x: d=>d,
        fill: d => "Ed Superior"
      }),     
      Plot.text([matriculaComuna.matriculadosES], {
        x: d=>d,
        text: d=> `${d} (${d3.format(".1%")(d/matriculaComuna.estudiantesEgresados)})`,
        dy:-25
      }),
      Plot.ruleX([0])
    ]
  });
})()
```
  * ${matriculaComuna.matriculadosU} en Universidades
  * ${matriculaComuna.matriculadosIP} en Institutos Profesionales
  * ${matriculaComuna.matriculadosCFT} en Centros de Formación Técnica


```js
// Define the data for the Sankey chart
const flujo = [
  {
    source: "",
    target: `Universidad (${matriculaComuna.matriculadosU})`,
    value: matriculaComuna.matriculadosU
  },
  {
    source: "",
    target: `IP (${matriculaComuna.matriculadosIP})`,
    value: matriculaComuna.matriculadosIP
  },
  {
    source: "",
    target: `CFT (${matriculaComuna.matriculadosCFT})`,
    value: matriculaComuna.matriculadosCFT
  }
]
```

```js
// Plot the Sankey chart for the selected comuna
const chartSankeyComuna = SankeyChart(
  {
    links: flujo
  },
  {
    nodeGroup: (d) => d.id.split(/\W/)[0], // take first word for color
    nodeAlign: "justify", // e.g., d3.sankeyJustify; set by input above
    linkColor: "target", // e.g., "source" or "target"; set by input above
    format: (
      (f) => (d) =>
        `${f(d)} TWh`
    )(d3.format(",.1~f")),
    width,
    height: 400
  }
)
```
${chartSankeyComuna}

<div class="text-muted small">Nota: puede haber matriculas de la misma persona en más de un tipo de Institución, por lo que las sumas de las cifras parciales pueden no coincidir con el total en Educación Superior.</div>
</div>


## Las 5 carreras e instituciones más frecuentes
<div class="small muted">Distintas especialidades de Ingeniería Civil se agrupan como "Ingeniería Civil".</div>

<div class="grid grid-cols-2">  

<div class="card" style="padding: 10;">  

## Carreras (hombres)
<ul>
${carrerasHombresComuna.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</ul>
</div>

<div class="card" style="padding: 10;">

## Carreras (mujeres)
<ul>
${carrerasMujeresComuna.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</ul>
</div>
</div>

<div class="grid grid-cols-1">
<div class="card" style="padding: 10;">

## Instituciones   
<ul>
${institucionesComuna.slice(0,5).map(d => html`<li> ${d.institucion} (${d.estudiantes} estudiantes)`)}
</ul>
</div>
</div>
</div>

<div class="card">

## Número de estudiantes según tipo de institucion de Educación Superior por estableciomiento en la comuna
```js
// Generate the table for the number of students by type of institution
html`<table class="table tablaEscuela2">
<thead>
<tr>
<th colspan="2"></th>
<th colspan="3">Matrícula Superior</th>
</tr>
<tr>
<th>Establecimiento</th>
<th>Egresados 2014</th>
<th>Ed.Sup.</th>
<th>Univ</th>
<th>IP</th>
<th>CFT</th>
</tr>
</thead>
<tbody>
${_.chain(matriculaPorEstablecimiento).sortBy(d => d.NOM_RBD).map(d => html`<tr>
<td>${d.NOM_RBD}</td>
<td>${d.estudiantesEgresados}</td>
<td>${d.matriculadosES}</td>
<td>${d.matriculadosU}</td>
<td>${d.matriculadosIP}</td>
<td>${d.matriculadosCFT}</td>
</tr>`).value()}
<tbody>
<caption>Nota: puede haber matriculas de la misma persona en más de un tipo de Institución, por lo que las sumas de las cifras parciales pueden no coincidir con el total en Educación Superior.</caption>
</table>`
```
</div>


```js
const dbMatricula = (async () => {
  const db =  await DuckDBClient.of({});
  db.query(`
    CREATE TABLE matricula AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/matricula_${comunaSeleccionada.comuna}.parquet`}"`)
 return db
})()
```

```js
const dbCarrera = (async () => {
  const db =  await DuckDBClient.of({});
  db.query(`
    CREATE TABLE carrera AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/carrera_${comunaSeleccionada.comuna}.parquet`}"`)
  return db
})()
```

```js
const dbInstitucion = (async () => {
  const db =  await DuckDBClient.of({});
  db.query(`
    CREATE TABLE institucion AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/institucion_${comunaSeleccionada.comuna}.parquet`}"`)
 /*
 db.query(`
    CREATE TABLE institucionPorRBD AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/institucionPorRBD_${comunaSeleccionada.comuna}.parquet`}"`)
 db.query(`
    CREATE TABLE carreraPorRBD AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/carreraPorRBD_${comunaSeleccionada.comuna}.parquet`}"`)
  */
 return db
})()
```

```js
const db = (async () => {
  const db =  await DuckDBClient.of({});
 db.query(`
    CREATE TABLE carrera AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/carrera_${comunaSeleccionada.comuna}.parquet`}"`)
 db.query(`
    CREATE TABLE institucion AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/institucion_${comunaSeleccionada.comuna}.parquet`}"`)
 db.query(`
    CREATE TABLE institucionPorRBD AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/institucionPorRBD_${comunaSeleccionada.comuna}.parquet`}"`)
 db.query(`
    CREATE TABLE carreraPorRBD AS
    SELECT * 
    FROM "${`https://raw.githubusercontent.com/elaval/data_egresados_2014/main/agregadoPorComuna/carreraPorRBD_${comunaSeleccionada.comuna}.parquet`}"`)
  return db
})()
```




```js
let matriculaComuna_ = [...(await dbMatricula.sql`
SELECT 
  ${comunaSeleccionada.comuna} as comuna,
  sum(estudiantesEgresados)::Int AS estudiantesEgresados,
  sum(matriculadosES)::Int AS matriculadosES,
  sum(matriculadosU)::Int AS matriculadosU,
  sum(matriculadosIP)::Int AS matriculadosIP,
  sum(matriculadosCFT)::Int AS matriculadosCFT
FROM matricula`)][0]
```
```js
let matriculaComuna = matriculaComuna_["comuna"] == comunaSeleccionada.comuna ? matriculaComuna_ : {}
```

```js
let matriculaEstablecimiento = [...(await dbMatricula.sql`
SELECT 
  ${comunaSeleccionada.comuna} as comuna,
  estudiantesEgresados,
  matriculadosES,
  matriculadosU,
  matriculadosIP,
  matriculadosCFT
FROM matricula
WHERE RBD = ${establecimientoSeleccionado.RBD}`)][0]
```


```js
let matriculaPorEstablecimiento = [...(await dbMatricula.sql`
SELECT   ${comunaSeleccionada.comuna} as comuna, *
FROM matricula
ORDER BY NOM_RBD ASC`)]
```

```js
let carrerasComuna = [...(await dbCarrera.sql`
WITH tabla as (SELECT gen_alu,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, num_students as estudiantes
  FROM carrera)

SELECT   ${comunaSeleccionada.comuna} as comuna,
gen_alu,carrera, sum(estudiantes)::Int as estudiantes
FROM tabla
GROUP BY gen_alu,carrera
ORDER BY gen_alu,estudiantes DESC`)]
```


```js
const carrerasHombresComuna = _.chain(carrerasComuna)
  .filter(d => d.gen_alu == 1)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```js
const carrerasMujeresComuna = _.chain(carrerasComuna)
  .filter(d => d.gen_alu == 2)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```


```js
let institucionesComuna = [...(await dbInstitucion.sql`
WITH tabla as (SELECT nomb_inst as institucion, num_students as estudiantes
  FROM institucion)

SELECT  ${comunaSeleccionada.comuna} as comuna, institucion, estudiantes
FROM tabla
ORDER BY estudiantes DESC`)]
```


```js
let carrerasEstablecimiento = [...(await db.sql`
WITH tabla as (SELECT gen_alu,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, num_students as estudiantes
  FROM carreraPorRBD
  WHERE RBD = ${establecimientoSeleccionado.RBD})

SELECT  ${comunaSeleccionada.comuna} as comuna, gen_alu,carrera, sum(estudiantes)::Int as estudiantes
FROM tabla
GROUP BY gen_alu,carrera
ORDER BY gen_alu,estudiantes DESC`)]
```


```js
const carrerasHombresEstablecimiento = _.chain(carrerasEstablecimiento)
  .filter(d => d.gen_alu == 1)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```js
const carrerasMujeresEstablecimiento = _.chain(carrerasEstablecimiento)
  .filter(d => d.gen_alu == 2)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```js
let institucionesEstablecimiento = [...(await db.sql`
WITH tabla as (SELECT nomb_inst as institucion, num_students as estudiantes
  FROM institucionPorRBD
  WHERE RBD = ${establecimientoSeleccionado.RBD})


SELECT  ${comunaSeleccionada.comuna} as comuna, institucion, estudiantes
FROM tabla
ORDER BY estudiantes DESC`)]
```

```js
display(matriculaComuna);
display(matriculaEstablecimiento);
display(matriculaPorEstablecimiento);
display(carrerasHombresComuna);
display(carrerasMujeresComuna);
display(institucionesComuna);
display(carrerasHombresEstablecimiento);
display(carrerasMujeresEstablecimiento);
display(institucionesEstablecimiento);

```




```js
// Define the selected establishment based on the selected comuna
const establecimientoSeleccionado = (() =>{
  const options = _.chain([...establecimientos])
    .filter((d) => d.NOM_COM_RBD == comunaSeleccionada.comuna)
    .filter((d) => d.numeroEstudiantes > 20)
    .sortBy((d) => d.NOM_RBD)
    .value();

  return view(Inputs.select(options, {
    format: (d) => `${d.NOM_RBD} (${d.numeroEstudiantes} estudiantes)`,
    label:"Establecimiento",
    value: _.chain(options).maxBy(d => d.numeroEstudiantes).value()
  }));
})()

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
