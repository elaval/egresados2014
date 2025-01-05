---
toc: false

sidebar: false
header: false
footer: false
pager: false

sql:
  establecimientos: ../NEM_PERCENTILES_AGGREGATED.parquet
  comunas: ../data/comunas.json
---

```js
import {analisisTrayectorias} from "../components/analisisTrayectorias.js";
import {SankeyChart} from "../components/SankeyChart.js";
```

```js
// Initialize the DuckDB client with the required data files
const dbMatricula = await DuckDBClient.of({
  matricula : FileAttachment(`../data/agregadoPorComuna/matricula_${observable.params.comuna}.parquet`),
  });
```

```js
// Initialize the DuckDB client with the required data files
const dbCarrera = await DuckDBClient.of({
  carrera : FileAttachment(`../data/agregadoPorComuna/carrera_${observable.params.comuna}.parquet`),
  });
```

```js
// Initialize the DuckDB client with the required data files
const dbCarreraPorRBD = await DuckDBClient.of({
  carrera : FileAttachment(`../data/agregadoPorComuna/carreraPorRBD_${observable.params.comuna}.parquet`),
  });
```

```js
// Initialize the DuckDB client with the required data files
const dbInstitucion = await DuckDBClient.of({
  institucion : FileAttachment(`../data/agregadoPorComuna/institucion_${observable.params.comuna}.parquet`),
  });
```

```js
// Initialize the DuckDB client with the required data files
const dbInstitucionPorRBD = await DuckDBClient.of({
  institucion : FileAttachment(`../data/agregadoPorComuna/institucionPorRBD_${observable.params.comuna}.parquet`),
  });
```

```js
let matriculaComuna = [...(await dbMatricula.sql`
SELECT sum(estudiantesEgresados)::Int AS estudiantesEgresados,
  sum(matriculadosES)::Int AS matriculadosES,
  sum(matriculadosU)::Int AS matriculadosU,
  sum(matriculadosIP)::Int AS matriculadosIP,
  sum(matriculadosCFT)::Int AS matriculadosCFT
FROM matricula`)][0]
```

```js
let matriculaEstablecimiento = [...(await dbMatricula.sql`
SELECT estudiantesEgresados,
  matriculadosES,
  matriculadosU,
  matriculadosIP,
  matriculadosCFT
FROM matricula
WHERE RBD = ${establecimientoSeleccionado.RBD}`)][0]
```

```js
let matriculaPorEstablecimiento = [...(await dbMatricula.sql`
SELECT  *
FROM matricula
ORDER BY NOM_RBD ASC`)]
```

```js
let carrerasComuna = [...(await dbCarrera.sql`
WITH tabla as (SELECT gen_alu,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, num_students as estudiantes
  FROM carrera)

SELECT gen_alu,carrera, sum(estudiantes)::Int as estudiantes
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

SELECT institucion, estudiantes
FROM tabla
ORDER BY estudiantes DESC`)]
```

```js
let carrerasEstablecimiento = [...(await dbCarreraPorRBD.sql`
WITH tabla as (SELECT gen_alu,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, num_students as estudiantes
  FROM carrera
  WHERE RBD = ${establecimientoSeleccionado.RBD})

SELECT gen_alu,carrera, sum(estudiantes)::Int as estudiantes
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
let institucionesEstablecimiento = [...(await dbInstitucionPorRBD.sql`
WITH tabla as (SELECT nomb_inst as institucion, num_students as estudiantes
  FROM institucion
  WHERE RBD = ${establecimientoSeleccionado.RBD})


SELECT institucion, estudiantes
FROM tabla
ORDER BY estudiantes DESC`)]
```

<!-- SQL query to select all data from the 'comunas' table -->
```sql id=comunas
SELECT *
FROM comunas
```

<!-- SQL query to select all data from the 'establecimientos' table -->
```sql id=establecimientos
SELECT * 
FROM establecimientos
```

<!-- JavaScript code to reset the loaded state if there are any establecimientos -->
```js
if ([...establecimientos].length > 0) {
  reset()
}
```

<!-- JavaScript code to define a mutable state 'loaded' and a reset function to set 'loaded' to true -->
```js
const loaded = Mutable(false);
const reset = () => loaded.value = true;
```

```js
const targetRegion = [...comunas].find(d => d.comuna == observable.params.comuna)["cod_region"]
```

# Matrícula en carreras de Educación Superior según comuna de egreso

<!-- Display a loading message until the data is loaded -->
**${loaded ? '' : `Cargando datos para ${observable.params.comuna} ...`}** 

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
          value: options.find(d => d.region == targetRegion)
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
    value: options.find(d => d.comuna == observable.params.comuna) || _.chain(options).maxBy(d => d.numeroEstudiantes).value()
  }));
})()
```

```js
// Redirect to the selected comuna's page if it is different from the current one
if(comunaSeleccionada.comuna !== observable.params.comuna) {
window.location.href = `./${comunaSeleccionada.comuna}`;
}
```


```js
// Initialize the DuckDB client with the required data files
const db_detalle = await DuckDBClient.of({
  datos : FileAttachment(`../data/comuna/${observable.params.comuna}.parquet`),
  establecimientos: FileAttachment(`../NEM_PERCENTILES_AGGREGATED.parquet`)  
  });
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

## Permanencia y cambio en carreras de pregrado

<div class="card">

De los ${resumenCambiosComuna.totalMatriculados} estudiantes matriculados en carreras de pregrado:  
* ${resumenCambiosComuna.matriculados1Carrera} (${d3.format(".1%")(resumenCambiosComuna.matriculados1Carrera/resumenCambiosComuna.totalMatriculados)}) registraron matrícula en una única carrera dentro de la misma institución.
* ${resumenCambiosComuna.matriculadosProbablemente1Carrera} (${d3.format(".1%")(resumenCambiosComuna.matriculadosProbablemente1Carrera/resumenCambiosComuna.totalMatriculados)}) iniciaron en programas como Plan Común de Ingeniería o Bachillerato, que corresponde a una "continuidad esperada" y no se considera un cambio real de carrera.
* ${resumenCambiosComuna.matriculadosMultiplesCarreras} (${d3.format(".1%")(resumenCambiosComuna.matriculadosMultiplesCarreras/resumenCambiosComuna.totalMatriculados)}) registraron matrícula en más de una carrera o en más de una institución.


${chartProporciónCambioCarrera}


```js
// Plot the bar chart for the proportion of students who changed careers
const chartProporciónCambioCarrera = (() => {
  return Plot.plot({
    subtitle:"Proporción que registra cambios de carrera",
    marginTop:30,
    marginRight:30,
    marks: [
      Plot.barX([resumenCambiosComuna.totalMatriculados], {
        x: d => d,
        fill: `lightgrey`,
      }),
      Plot.barX([resumenCambiosComuna.matriculadosMultiplesCarreras], {
        x: d => d,
        fill: (d) => `cambio`,
      }),
      Plot.text([resumenCambiosComuna.matriculadosMultiplesCarreras], {
        text: d => `${d} (${d3.format(".1%")(d/resumenCambiosComuna.totalMatriculados)})`,
        dy:-20,
        x: d => d,
      })
    ]
  });
})()
```


```js
// Analyze the data for students who changed careers
const infoCambioCarrera = (() => {

  const candidatosCambioCarrera = _.chain(statsTrayectoriaComuna.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => d.itemsConCambioCarrera)
    .flatten()
    .flatten()
    .map((d) => d.registros)
    .flatten()
    .map((d) => d.mrun)
    .value();

  const dataPlot = _.chain(statsTrayectoriaComuna.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => d.itemsConCambioCarrera)
    .flatten()
    .flatten()
    .map((d) => d.registros)
    .flatten()
    .filter((d) => candidatosCambioCarrera.includes(d.mrun))
    .value();

  return _.chain(dataPlot)
  .groupBy(d => d.mrun)
  .map((items,key) => ({
    mrun:key,
    diferentesCarreras: _.chain(items).groupBy(d => `${d.area_carrera_generica}-${d.nomb_inst}`).map((items,key) => items[0]).value(),
    areas: _.chain(items).groupBy(d => d.cine_f_13_area).map((items,key) => key).uniq().value(),
    subareas: _.chain(items).groupBy(d => d.cine_f_13_subarea).map((items,key) => key).uniq().value()
  }))
  .value()

})()

const muestraCambioCarreras = _.chain(infoCambioCarrera)
.sortBy(d => d.areas.length)
.reverse()
.slice(0,10)
.sampleSize(3)
.map((d,i) => ({
  caso: `Estudiante ${i+1}`,
  carreras: d.diferentesCarreras.map(d => ({
    año: d.cat_periodo,
    carrera: d.nomb_carrera,
    institucion: d.nomb_inst
  }))
}))
.value()

```
### Ejemplos de casos de cambio de carrera
<ul>
${muestraCambioCarreras.map(d => html`<li> ${d.caso}
<ul>${d.carreras.map(e => html`<li class="small"> ${e.año} ${e.carrera} (${e.institucion})`)}</ul>`)}
</ul>

</div>

----------
# Información de un establecimiento específico
Seleccione un establecimiento específico en ${comunaSeleccionada.comuna} para obtener datos del establecimiento detalles 

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
## ${establecimientoSeleccionado.NOM_RBD} (${aliasDependencia[establecimientoSeleccionado.COD_DEPE2]})
### ${comunaSeleccionada.comuna}

<div class="card" style="padding: 10;">  

## Resumen General
En ${establecimientoSeleccionado.NOM_RBD}, egresaron ${
    matriculaEstablecimiento.estudiantesEgresados
  } estudiantes en 2014.

Entre 2015 y 2024:
* ${matriculaEstablecimiento.matriculadosES} (${d3.format(".1%")(matriculaEstablecimiento.matriculadosES/matriculaEstablecimiento.estudiantesEgresados)}) se matricularon en alguna carrera de Educación Superior.

```js
// Plot the bar chart for the selected establishment
(() => {
  return Plot.plot({
    marginTop:30,
    marginRight:30,
    marks: [
      Plot.barX([matriculaEstablecimiento.estudiantesEgresados], {
        x: d=>d,
        fill: "lightgray"
      }),
     Plot.barX([matriculaEstablecimiento.matriculadosES], {
        x: d=>d,
        fill: d => "Ed Superior"
      }),     
      Plot.text([matriculaEstablecimiento.matriculadosES], {
        x: d=>d,
        text: d=> `${d} (${d3.format(".1%")(d/matriculaEstablecimiento.estudiantesEgresados)})`,
        dy:-25
      }),

      Plot.ruleX([0])
    ]
  });
})()
```
  * ${matriculaEstablecimiento.matriculadosU} en Universidades
  * ${matriculaEstablecimiento.matriculadosIP} en Institutos Profesionales
  * ${matriculaEstablecimiento.matriculadosCFT} en Centros de Formación Técnica.

```js
// Define the data for the Sankey chart for the selected establishment
const flujoEstablecimiento = [
  {
    source: "",
    target: `Universidad (${matriculaEstablecimiento.matriculadosU})`,
    value: matriculaEstablecimiento.matriculadosU
  },
  {
    source: "",
    target: `IP (${matriculaEstablecimiento.matriculadosIP})`,
    value: matriculaEstablecimiento.matriculadosIP
  },
  {
    source: "",
    target: `CFT (${matriculaEstablecimiento.matriculadosCFT})`,
    value: matriculaEstablecimiento.matriculadosCFT
  }
]
```

```js
// Plot the Sankey chart for the selected establishment
const chartSankeyEstablecimiento = SankeyChart(
  {
    links: flujoEstablecimiento
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
    height: 500
  }
)
```

${chartSankeyEstablecimiento}  

<div class="text-muted small">
Nota: puede haber matriculas de la misma persona en más de un tipo de Institución, por lo que las sumas de las cifras parciales pueden no coincidir con el total en Educación Superior.
</div>


</div>

## Las 5 carreras e instituciones más frecuentes
<div class="small muted">Distintas especialidades de Ingeniería Civil se agrupan como "Ingeniería Civil".</div>

<div class="grid grid-cols-2">
<div class="card" style="padding: 10;">  

## Carreras (hombres)
${carrerasHombresEstablecimiento.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">  

## Carreras (mujeres)
${carrerasMujeresEstablecimiento.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">

## Instituciones   
${institucionesEstablecimiento.slice(0,5).map(d => html`<li> ${d.institucion} (${d.estudiantes} estudiantes)`)}
</div>
</div>


```js
// Summarize the data for the selected establishment
const resumen = (() => {
  const candidatosCambioCarrera = _.chain(statsTrayectoriaEstablecimiento.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => {
      const cantidatosCambioCarrera = d.itemsConCambioCarrera.map(
        (e) => e[0].registros[0].mrun
      );
      return cantidatosCambioCarrera;
    })
    .flatten()
    .uniq()
    .value();

  const resumen = {
    egresados2014: establecimientoSeleccionado.numeroEstudiantes,
    totalMatriculados: statsTrayectoriaEstablecimiento.numeroEstudiantesConMatricula,
    matriculados1Carrera: statsTrayectoriaEstablecimiento.desgloseCarrerasPorEstudiante.find(
      (d) => d.numCarreras == "1"
    )["numEstudiantes"],
    matriculadosProbablemente1Carrera: _.chain(
      statsTrayectoriaEstablecimiento.desgloseCarrerasPorEstudiante
    )
      .filter((d) => d.numCarreras !== "1")
      .map((d) => d.items)
      .flatten()
      .flatten()
      .map((d) => d.registros[0].mrun)
      .uniq()
      .filter((d) => !candidatosCambioCarrera.includes(d))
      .value()["length"],
    matriculadosMultiplesCarreras: _.chain(statsTrayectoriaEstablecimiento.desgloseCarrerasPorEstudiante)
      .filter((d) => d.numCarreras !== "1")
      .map((d) => d.items)
      .flatten()
      .flatten()
      .map((d) => d.registros[0].mrun)
      .uniq()
      .filter((d) => candidatosCambioCarrera.includes(d))
      .value()["length"]
  };

  return resumen;
})()
```


```js
// Summarize the data for the selected comuna
const resumenCambiosComuna = (() => {
  const candidatosCambioCarrera = _.chain(statsTrayectoriaComuna.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => {
      const cantidatosCambioCarrera = d.itemsConCambioCarrera.map(
        (e) => e[0].registros[0].mrun
      );
      return cantidatosCambioCarrera;
    })
    .flatten()
    .uniq()
    .value();

  const resumen = {
    egresados2014: comunaSeleccionada.numeroEstudiantes,
    totalMatriculados: statsTrayectoriaComuna.numeroEstudiantesConMatricula,
    matriculados1Carrera: statsTrayectoriaComuna.desgloseCarrerasPorEstudiante.find(
      (d) => d.numCarreras == "1"
    )["numEstudiantes"],
    matriculadosProbablemente1Carrera: _.chain(
      statsTrayectoriaComuna.desgloseCarrerasPorEstudiante
    )
      .filter((d) => d.numCarreras !== "1")
      .map((d) => d.items)
      .flatten()
      .flatten()
      .map((d) => d.registros[0].mrun)
      .uniq()
      .filter((d) => !candidatosCambioCarrera.includes(d))
      .value()["length"],
    matriculadosMultiplesCarreras: _.chain(statsTrayectoriaComuna.desgloseCarrerasPorEstudiante)
      .filter((d) => d.numCarreras !== "1")
      .map((d) => d.items)
      .flatten()
      .flatten()
      .map((d) => d.registros[0].mrun)
      .uniq()
      .filter((d) => candidatosCambioCarrera.includes(d))
      .value()["length"]
  };

  return resumen;
})()
```



```js
// Analyze the trajectories of students in the selected establishment and comuna
const statsTrayectoriaEstablecimiento = analisisTrayectorias(datosEstablecimiento)
const statsTrayectoriaComuna = analisisTrayectorias(datosComuna)
```

```js
// Query the data for the selected comuna
const datosComuna = [...await db_detalle.query(`
SELECT *
FROM datos
WHERE nivel_global = 'Pregrado'
`)]
```

```js
// Query the data for the selected establishment
const datosEstablecimiento = [...await db_detalle.query(`
SELECT *
FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD} AND nivel_global = 'Pregrado' 
`)]
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


----------
## ¿Cómo se obtuvieron estos datos?
Los datos utilizados en este análisis provienen de registros oficiales de egreso de Enseñanza Media y matrícula en Educación Superior en Chile, disponibles a través de Datos Abiertos del MINEDUC (https://datosabiertos.mineduc.cl/).

* Datos de jóvenes egresados de Educación Media: https://datosabiertos.mineduc.cl/notas-de-ensenanza-media-y-percentil-jovenes/
* Datos de matrícula en Educación Superior: https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/

## Notas
* **Áreas Genéricas**
Hay carreras que formalmente tienen nombres diferentes pero en la práctica corresponden a la misma área. Por ejemplo: "AGRONOMIA E INGENIERIA FORESTAL" en la PONTIFICIA UNIVERSIDAD CATOLICA DE CHILE e "INGENIERIA AGRONOMICA" en la UNIVERSIDAD DE CHILE corresponden al área genérica "Agronomía". Para efectos del análisis en esta exploración se utiliza la clasificación de "Área Genérica" (campo **area_carrera_generica**) del Sistema de Información de la Educación Superior (SIES).

* **Plan común de Ingeniería Civil**
El plan común de Ingeniería Civil en Chile es un programa inicial ofrecido por muchas universidades que permite a los estudiantes comenzar sus estudios en ingeniería sin elegir inmediatamente una especialidad. Es un camino introductorio en el que se entregan las bases científicas, matemáticas y técnicas necesarias para luego optar por una especialidad específica dentro de las distintas ramas de la Ingeniería Civil.

  En la Universidad de Chile, por ejemplo, estudiantes que se matriculan inicialmente en Plan Común pueden continuar con especialidades de la carrera de Ingeniería Civil, y también con la carrera de Geología y licenciaturas en Física, Astronomía y Geofísica (fuente: https://ingenieria.uchile.cl/carreras/plan-comun).

* **Ingreso vía Bachillerato o College**
El ingreso a la educación superior a través de programas como Bachillerato o College representa una alternativa cada vez más popular para los estudiantes que desean explorar diferentes áreas del conocimiento antes de comprometerse con una carrera específica. Estos programas están diseñados para ofrecer una formación inicial general en áreas como ciencias, humanidades, artes o ingeniería. Los estudiantes pueden acceder a una continuidad académica hacia carreras específicas dentro de la misma institución, facilitando la transición hacia programas más especializados.

En este análisis se considera como un caso de continuidad esperada cuando hay indicios de que los estudiantes ingresaron a Plan Común de Ingeniería o a Bachillerato / College y luego registran matrícula en carreras de la misma universidad. Para el Plan Común de Ingeniería Civil se considera continuidad si luego hay matrícula en otra carrera de Ingeniería Civil, Geología, Física, Astronomía o Geofísica en la misma universidad.

  
Autor de esta página: Ernesto Laval https://bsky.app/profile/elaval.bsky.social



