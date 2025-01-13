---
toc: false
sidebar: false
header: false
footer: false
pager: false

sql:
  carrera: ./data/carrera_Chile.parquet
  carreraPorEstablecimiento: ./data/carreraPorRBD_Chile.parquet
  matricula: ./data/matricula_Chile.parquet
  institucion: ./data/institucion_Chile.parquet
  institucionPorEstablecimiento: ./data/institucionPorRBD_Chile.parquet
  establecimientos: ./NEM_PERCENTILES_AGGREGATED.parquet
  comunas: ./data/comunas.json
  numcarreras_por_comuna: ./data/numcarreras_por_comuna.parquet
  muestra_comunas_3_or_2_carreras: ./data/muestra_comunas_3_or_2_carreras.parquet
---

```js
import {analisisTrayectorias} from "./components/analisisTrayectorias.js";
import {SankeyChart} from "./components/SankeyChart.js";
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


```SQL id=[matriculaComuna]
SELECT sum(estudiantesEgresados)::Int AS estudiantesEgresados,
  sum(matriculadosES)::Int AS matriculadosES,
  sum(matriculadosU)::Int AS matriculadosU,
  sum(matriculadosIP)::Int AS matriculadosIP,
  sum(matriculadosCFT)::Int AS matriculadosCFT
FROM matricula
WHERE NOM_COM_RBD = ${comunaSeleccionada.comuna}
```


```sql id=carrerasComuna
WITH tabla as (SELECT gen_alu,
  NOM_COM_RBD as comuna,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, num_students as estudiantes
  FROM carrera
  WHERE NOM_COM_RBD = ${comunaSeleccionada.comuna}
)

SELECT gen_alu,carrera, sum(estudiantes)::Int as estudiantes
FROM tabla
GROUP BY gen_alu,carrera
ORDER BY gen_alu,estudiantes DESC
```


```js
const carrerasHombresComuna = _.chain([...carrerasComuna])
  .filter(d => d.gen_alu == 1)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```js
const carrerasMujeresComuna = _.chain([...carrerasComuna])
  .filter(d => d.gen_alu == 2)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```sql id=institucionesComuna
WITH tabla as (SELECT nomb_inst as institucion, num_students as estudiantes
  FROM institucion
  WHERE NOM_COM_RBD = ${comunaSeleccionada.comuna}
  )

SELECT institucion, estudiantes
FROM tabla
ORDER BY estudiantes DESC
```

```SQL id=[matriculaEstablecimiento] 
SELECT sum(estudiantesEgresados)::Int AS estudiantesEgresados,
  sum(matriculadosES)::Int AS matriculadosES,
  sum(matriculadosU)::Int AS matriculadosU,
  sum(matriculadosIP)::Int AS matriculadosIP,
  sum(matriculadosCFT)::Int AS matriculadosCFT
FROM matricula
WHERE RBD = ${establecimientoSeleccionado.RBD}
```

```SQL id=matriculaPorEstablecimiento 
SELECT  *
FROM matricula
WHERE NOM_COM_RBD = ${comunaSeleccionada.comuna}
ORDER BY NOM_RBD ASC

```

```sql id=carrerasEstablecimiento
WITH tabla as (SELECT gen_alu,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, num_students as estudiantes
  FROM carreraPorEstablecimiento
  WHERE RBD = ${establecimientoSeleccionado.RBD})

SELECT gen_alu,carrera, sum(estudiantes)::Int as estudiantes
FROM tabla
GROUP BY gen_alu,carrera
ORDER BY gen_alu,estudiantes DESC
```

```js
const carrerasHombresEstablecimiento = _.chain([...carrerasEstablecimiento])
  .filter(d => d.gen_alu == 1)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```js
const carrerasMujeresEstablecimiento = _.chain([...carrerasEstablecimiento])
  .filter(d => d.gen_alu == 2)
  .sortBy(d => d.estudiantes)
  .reverse()
  .slice(0,5)
  .value()
```

```sql id=institucionesEstablecimiento
WITH tabla as (SELECT nomb_inst as institucion, num_students as estudiantes
  FROM institucionPorEstablecimiento
  WHERE RBD = ${establecimientoSeleccionado.RBD})


SELECT institucion, estudiantes
FROM tabla
ORDER BY estudiantes DESC
```


```sql id=[resumenMultiplesCarrerasComuna]
SELECT *
FROM numcarreras_por_comuna
WHERE NOM_COM_RBD = ${comunaSeleccionada.comuna}
```

```sql id=muestraMultiplesCarreras
SELECT *
FROM muestra_comunas_3_or_2_carreras
WHERE NOM_COM_RBD = ${comunaSeleccionada.comuna}
```


<!-- JavaScript code to reset the loaded state if there are any establecimientos -->
```js
if ([...establecimientos].length > 0 && [...matriculaComuna].length > 0 && [...carrerasComuna].length > 0  && [...institucionesComuna].length > 0) {
  reset()
}
```

<!-- JavaScript code to define a mutable state 'loaded' and a reset function to set 'loaded' to true -->
```js
const loaded = Mutable(false);
const reset = () => loaded.value = true;
```

# Continuidad de Estudios en Educación Superior: Análisis por Comuna y Establecimiento
## Reporte en base a carreras de pregrado e Instituciones de Educación Superior en que se matriculan jovenes egresados de Enseñanza media durante los 9 años siguientes a su egreso.

Este análisis explora los datos de matrícula en Educación Superior de jóvenes egresados de Educación Media en 2014


<!-- Display a loading message until the data is loaded -->
**${loaded ? '' : `Cargando datos ...`}** 


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
      value: _.sample(options)
  }));
})()
```

```js
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



## ${comunaSeleccionada.comuna}
<div class="card" style="padding: 10;">  

## Resumen de Egresos y Matrícula en Educación Superior
En 2014, egresaron **${matriculaComuna.estudiantesEgresados}** estudiantes de Eucación Media en **${comunaSeleccionada.comuna}**.

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
Egresados matriculados por tipo de Institución (Universidad, IP, CFT)  
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

<div class="text-muted small">Nota: puede haber matriculas de la misma persona en más de un tipo de Institución, por lo que las sumas de las cifras parciales  no necesariamente coinciden con el total en Educación Superior.</div>
</div><br>

</div>


Top 5 de Carreras por Género
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
<div class="small muted">Nota: Se agruparon especialidades de Ingeniería Civil para un análisis más claro de las carreras más frecuentes.</div>  
<br>
Top 5 de Instituciones de Educación Superior
<div class="grid grid-cols-1">
<div class="card" style="padding: 10;">


## Instituciones   
<ul>
${[...institucionesComuna].slice(0,5).map(d => html`<li> ${d.institucion} (${d.estudiantes} estudiantes)`)}
</ul>
</div>
</div>
</div>

### Establecimientos en la communa
Matrícula en Educación Superior por Establecimiento: Detalles y Comparaciones
<div class="card">

## Número de estudiantes según tipo de institucion de Educación Superior por estableciomiento en la comuna
```js
// Generate the table for the number of students by type of institution
html`
<div class="table-responsive">
<table class="table tablaEscuela2">
<thead>
<tr>
<th colspan="2"></th>
<th colspan="4">Matrícula Ed. Superior</th>
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
${_.chain([...matriculaPorEstablecimiento]).sortBy(d => d.NOM_RBD).map(d => html`<tr>
<td>${d.NOM_RBD}</td>
<td>${d.estudiantesEgresados}</td>
<td>${d.matriculadosES}</td>
<td>${d.matriculadosU}</td>
<td>${d.matriculadosIP}</td>
<td>${d.matriculadosCFT}</td>
</tr>`).value()}
<tbody>
<caption>Nota: puede haber matriculas de la misma persona en más de un tipo de Institución, por lo que las sumas de las cifras parciales  no necesariamente coinciden con el total en Educación Superior.</caption>
</table>
</div>`
```
</div>



## Cambios y permanencia en carreras de pregrado

<div class="card">



De los ${matriculaComuna.matriculadosES} estudiantes matriculados en carreras de pregrado:  
* **${resumenMultiplesCarrerasComuna.count_mas_de_1_carrera} (${d3.format(".1%")(resumenMultiplesCarrerasComuna.count_mas_de_1_carrera/matriculaComuna.matriculadosES)}) registraron matrícula en más de una carrera** o en más de una institución entre 2015 y 2024.
* ${resumenMultiplesCarrerasComuna.count_1_carrera} (${d3.format(".1%")(resumenMultiplesCarrerasComuna.count_1_carrera/matriculaComuna.matriculadosES)}) registraron matrícula en una única carrera dentro de la misma institución.


${chartProporciónCambioCarrera}


```js
// Plot the bar chart for the proportion of students who changed careers
const chartProporciónCambioCarrera = (() => {
  return Plot.plot({
    subtitle:"Proporción que registra cambios de carrera",
    marginTop:30,
    marginRight:30,
    marks: [
      Plot.barX([matriculaComuna.matriculadosES], {
        x: d => d,
        fill: `lightgrey`,
      }),
      Plot.barX([resumenMultiplesCarrerasComuna.count_mas_de_1_carrera], {
        x: d => d,
        fill: (d) => `cambio`,
      }),
      Plot.text([resumenMultiplesCarrerasComuna.count_mas_de_1_carrera], {
        text: d => `${d} (${d3.format(".1%")(d/matriculaComuna.matriculadosES)})`,
        dy:-20,
        x: d => d,
      })
    ]
  });
})()
```

```js
const muestraCambioCarreras = _.chain([...muestraMultiplesCarreras])
.groupBy(d => d.mrun)
.map((items,mrun) => ({mrun:mrun, carreras: items}))
.value()

```


### Ejemplos de casos de cambio de carrera
<ul>
${_.chain([...muestraMultiplesCarreras])
.groupBy(d => d.mrun)
.map((items,mrun) => ({mrun:mrun, carreras: items}))
.map((d,i) => html`<li> Estudiante ${i+1}
<ul>${d.carreras.map(e => html`<li class="small"> ${e.cat_periodo} ${e.area_carrera_generica} (${e.nomb_inst})`)}</ul>`).value()}
</ul>

</div>

----------
# Información de un establecimiento específico
Seleccione un establecimiento específico en ${comunaSeleccionada.comuna} para obtener detalles del establecimiento  

```js
// Define the selected establishment based on the selected comuna
const establecimientoSeleccionado = (() =>{
  const options = _.chain([...establecimientos])
    .filter((d) => d.NOM_COM_RBD == comunaSeleccionada.comuna)
    //.filter((d) => d.numeroEstudiantes > 20)
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

## Perfil por establecimiento: ${establecimientoSeleccionado.NOM_RBD}
En 2014, egresaron **${ matriculaEstablecimiento.estudiantesEgresados}** estudiantes de **${establecimientoSeleccionado.NOM_RBD}**.

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

Top 5 de Carreras por Género
<div class="grid grid-cols-2">
<div class="card" style="padding: 10;">  

## Carreras (hombres)
${carrerasHombresEstablecimiento.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">  

## Carreras (mujeres)
${carrerasMujeresEstablecimiento.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
</div>
<div class="small muted">Distintas especialidades de Ingeniería Civil se agrupan como "Ingeniería Civil".</div>  
  
<br>
Top 5 de Instituciones de Educación Superior 
<div class="grid grid-cols-1">
<div class="card" style="padding: 10;">

${[...institucionesEstablecimiento].slice(0,5).map(d => html`<li> ${d.institucion} (${d.estudiantes} estudiantes)`)}
</div>
</div>


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
## Origen de datos y definiciones
**Fuente de datos**  
Los datos utilizados en este análisis provienen de registros de egreso de Enseñanza Media y matrícula en Educación Superior en Chile, disponibles a través de Datos Abiertos del MINEDUC (https://datosabiertos.mineduc.cl/).

* Datos de jóvenes egresados de Educación Media: https://datosabiertos.mineduc.cl/notas-de-ensenanza-media-y-percentil-jovenes/
* Datos de matrícula en Educación Superior: https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/

**Carreras Genéricas**  
Carreras similares, como Ingeniería Agronómica o Agronomía e Ingeniería Forestal se agrupan bajo áreas genéricas para facilitar el análisis (se utiliza la definición de Aréa Carrera Genérica del Sistema de Información de la Educación Superior).

**Ingeniería Civil**  
Distintas carreras en la familia de "Ingeniería Civil" (Ej. Ingeniería Civil Electrónica, Ingeniería Civil Eléctrica, Ingeniería Civil Industrial, ...) se agrupan bajo "Ingeniería Civil" al reportar carreras más frecuentes.


**Plan común de Ingeniería Civil**  
Al analizar cambios de carrera, no se considera un cambio de carrera cuando la matrícula inicial es en Plan Común de Ingeniería Civil y luego existe matrícula en carreras de Ingeniería Civil, Geología o Astronomía y Física en la misma institución.

**Ingreso vía Bachillerato o College**  
Al analizar cambios de carrera, no se considera un cambio de carrera cuando la matrícula inicial es en un programa de Bachillerato o College y luego hay matrícula en otras carreras de la misma institución.

  
Autor de esta página: Ernesto Laval https://bsky.app/profile/elaval.bsky.social
