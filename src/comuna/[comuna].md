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

```sql id=comunas
SELECT *
FROM comunas
```

```sql id=establecimientos
SELECT * 
FROM establecimientos
```


# Matrícula en carreras universitarias según comuna de egreso



```js
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
          value: options.find(d => d.region == comunaSeleccionada3["COD_REG_RBD"])
  }));
})()
```

```js
const comunaSeleccionada2 = (() => {
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
if(comunaSeleccionada2.comuna !== observable.params.comuna) {
window.location.href = `./${comunaSeleccionada2.comuna}`;

}

```



```sql id=[comunaSeleccionada3]
SELECT  COD_REG_RBD, NOM_REG_RBD_A, COD_COM_RBD, NOM_COM_RBD, SUM(numeroEstudiantes)::Int as numeroEstudiantes
FROM establecimientos
WHERE NOM_COM_RBD = ${observable.params.comuna}
GROUP BY COD_REG_RBD, NOM_REG_RBD_A, COD_COM_RBD, NOM_COM_RBD
```




```js
const comunaSeleccionada = ({
    comuna : establecimientoSeleccionado["NOM_COM_RBD"]
})
```

```js
const db = await DuckDBClient.of({
  datos : FileAttachment(`../data/comuna/${observable.params.comuna}.parquet`),
  establecimientos: FileAttachment(`../NEM_PERCENTILES_AGGREGATED.parquet`)  
  });
```

<div class="card">

## ${comunaSeleccionada3.NOM_COM_RBD}
## Resumen General
En ${comunaSeleccionada3.NOM_COM_RBD}, egresaron ${
    comunaSeleccionada3.numeroEstudiantes
  } estudiantes en 2014.

Entre 2015 y 2024:
* ${statsComuna.totalEdSuperior} (${d3.format(".1%")(statsComuna.totalEdSuperior/comunaSeleccionada3.numeroEstudiantes)}) se matricularon en alguna carrera de Educación Superior.

```js
(() => {
 

  return Plot.plot({

    marginTop:30,
    marks: [
      Plot.barX([comunaSeleccionada3.numeroEstudiantes], {
        x: d=>d,
        fill: "lightgray"
      }),
     Plot.barX([cifrasTipoEdSuperiorComuna[0].total], {
        x: d=>d,
        fill: d => "Ed Superior"
      }),     
      Plot.text([cifrasTipoEdSuperiorComuna[0].total], {
        x: d=>d,
        text: d=> `${d} (${d3.format(".1%")(d/comunaSeleccionada3.numeroEstudiantes)})`,
        dy:-25
      }),

      Plot.ruleX([0])
    ]
  });
})()
```
  * ${statsComuna.totalUniversidad} en Universidades
  * ${statsComuna.totalIP} en Institutos Profesionales
  * ${statsComuna.totalCFT} en Centros de Formación Técnica


```js
const flujo = [
  {
    source: "",
    target: `Universidad (${cifrasTipoEdSuperiorComuna[0].Universidad})`,
    value: cifrasTipoEdSuperiorComuna[0].Universidad
  },
  {
    source: "",
    target: `IP (${cifrasTipoEdSuperiorComuna[0].IP})`,
    value: cifrasTipoEdSuperiorComuna[0].IP
  },
  {
    source: "",
    target: `CFT (${cifrasTipoEdSuperiorComuna[0].CFT})`,
    value: cifrasTipoEdSuperiorComuna[0].CFT
  }
]
```

```js
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
    height: 500
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
${carrerasComunaHombres.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">


## Carreras (mujeres)
${carrerasComunaMujeres.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">

## Instituciones   
${universidadesComuna.slice(0,5).map(d => html`<li> ${d.nomb_inst} (${d.estudiantes} estudiantes)`)}
</div>
</div>





<table class="tablaEscuelas">
<tbody>
</tbody>
</table>


```js
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
${_.chain(cifrasTipoEdSuperiorPorEstablecimiento).sortBy(d => d.NOM_RBD).map(d => html`<tr>
<td>${d.NOM_RBD}</td>
<td>${d.estudiantesEgresados}</td>
<td>${d.total}</td>
<td>${d.Universidad}</td>
<td>${d.IP}</td>
<td>${d.CFT}</td>
</tr>`).value()}
<tbody>
</table>`
```


```js
const establecimientoSeleccionado = (() =>{
  const options = _.chain([...establecimientos])
    .filter((d) => d.NOM_COM_RBD == comunaSeleccionada2.comuna)
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
    establecimientoSeleccionado.numeroEstudiantes
  } estudiantes en 2014.

Entre 2015 y 2024:
* ${statsEstablecimiento.totalEdSuperior} (${d3.format(".1%")(statsEstablecimiento.totalEdSuperior/establecimientoSeleccionado.numeroEstudiantes)}) se matricularon en alguna carrera de Educación Superior.

```js
(() => {
 

  return Plot.plot({

    marginTop:30,
    marginRight:30,
    marks: [
      Plot.barX([establecimientoSeleccionado.numeroEstudiantes], {
        x: d=>d,
        fill: "lightgray"
      }),
     Plot.barX([statsEstablecimiento.totalEdSuperior], {
        x: d=>d,
        fill: d => "Ed Superior"
      }),     
      Plot.text([statsEstablecimiento.totalEdSuperior], {
        x: d=>d,
        text: d=> `${d} (${d3.format(".1%")(d/establecimientoSeleccionado.numeroEstudiantes)})`,
        dy:-25
      }),

      Plot.ruleX([0])
    ]
  });
})()
```
  * ${statsEstablecimiento.totalUniversidad} en Universidades ${statsEstablecimiento.totalUniversidad_Carrera_Profesional == statsEstablecimiento.totalUniversidad ? `en carreras profesionales` : `(${statsEstablecimiento.totalUniversidad_Carrera_Profesional} en carreras profesionales)`}.
  * ${statsEstablecimiento.totalIP} en Institutos Profesionales ${statsEstablecimiento.totalIP_Carrera_Profesional == statsEstablecimiento.totalIP ? `en carreras profesionales` : `(${statsEstablecimiento.totalIP_Carrera_Profesional} en carreras profesionales)`}.
  * ${statsEstablecimiento.totalCFT} en Centros de Formación Técnica.

```js
const flujoEstablecimiento = [
  {
    source: "",
    target: `Universidad (${cifrasTipoEdSuperior[0].Universidad})`,
    value: cifrasTipoEdSuperior[0].Universidad
  },
  {
    source: "",
    target: `IP (${cifrasTipoEdSuperior[0].IP})`,
    value: cifrasTipoEdSuperior[0].IP
  },
  {
    source: "",
    target: `CFT (${cifrasTipoEdSuperior[0].CFT})`,
    value: cifrasTipoEdSuperior[0].CFT
  }
]
```

```js
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


```js
const statsComuna = (() => {
  const totalEdSuperior = cifrasTipoEdSuperiorComuna[0].total;

  const totalUniversidad = cifrasTipoEdSuperiorComuna[0].Universidad;
  const totalUniversidad_Carrera_Profesional =
    cifrasTipoEdSuperiorComuna[0].Universidad_Carrera_Profesional;

  const totalUniversidad_Carrera_Técnica =
    cifrasTipoEdSuperiorComuna[0].Universidad_Carrera_Técnica;

  const totalIP = cifrasTipoEdSuperiorComuna[0].IP;
  const totalIP_Carrera_Profesional =
    cifrasTipoEdSuperiorComuna[0].IP_Carrera_Profesional;
  const totalIP_Carrera_Técnica = cifrasTipoEdSuperiorComuna[0].IP_Carrera_Técnica;

  const totalCFT = cifrasTipoEdSuperiorComuna[0].CFT;

  return {
    totalEdSuperior: totalEdSuperior,
    totalUniversidad: totalUniversidad,
    totalUniversidad_Carrera_Profesional: totalUniversidad_Carrera_Profesional,
    totalUniversidad_Carrera_Técnica:totalUniversidad_Carrera_Técnica,
    totalIP: totalIP,
    totalIP_Carrera_Profesional: totalIP_Carrera_Profesional,
    totalIP_Carrera_Técnica: totalIP_Carrera_Técnica,
    totalCFT: totalCFT
  };
})()
```

```js
const statsEstablecimiento = (() => {
  const totalEdSuperior = cifrasTipoEdSuperior[0].total;

  const totalUniversidad = cifrasTipoEdSuperior[0].Universidad;
  const totalUniversidad_Carrera_Profesional =
    cifrasTipoEdSuperior[0].Universidad_Carrera_Profesional;

  const totalUniversidad_Carrera_Técnica =
    cifrasTipoEdSuperior[0].Universidad_Carrera_Técnica;

  const totalIP = cifrasTipoEdSuperior[0].IP;
  const totalIP_Carrera_Profesional =
    cifrasTipoEdSuperior[0].IP_Carrera_Profesional;
  const totalIP_Carrera_Técnica = cifrasTipoEdSuperior[0].IP_Carrera_Técnica;

  const totalCFT = cifrasTipoEdSuperior[0].CFT;

  return {
    totalEdSuperior: totalEdSuperior,
    totalUniversidad: totalUniversidad,
    totalUniversidad_Carrera_Profesional: totalUniversidad_Carrera_Profesional,
    totalUniversidad_Carrera_Técnica:totalUniversidad_Carrera_Técnica,
    totalIP: totalIP,
    totalIP_Carrera_Profesional: totalIP_Carrera_Profesional,
    totalIP_Carrera_Técnica: totalIP_Carrera_Técnica,
    totalCFT: totalCFT
  };
})()
```


</div>

## Las 5 carreras e instituciones más frecuentes
<div class="small muted">Distintas especialidades de Ingeniería Civil se agrupan como "Ingeniería Civil".</div>

<div class="grid grid-cols-2">
<div class="card" style="padding: 10;">  

## Carreras (hombres)
${carrerasEstablecimientoHombres.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">  

## Carreras (mujeres)
${carrerasEstablecimientoMujeres.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
</div>
<div class="card" style="padding: 10;">

## Instituciones   
${universidades.slice(0,5).map(d => html`<li> ${d.nomb_inst} (${d.estudiantes} estudiantes)`)}
</div>
</div>


## Resumen de permanencia y cambio en carreras profesionales universitarias


```js
const resumen = (() => {
  const candidatosCambioCarrera = _.chain(stats.desgloseCarrerasPorEstudiante)
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
    totalMatriculados: stats.numeroEstudiantesConMatricula,
    matriculados1Carrera: stats.desgloseCarrerasPorEstudiante.find(
      (d) => d.numCarreras == "1"
    )["numEstudiantes"],
    matriculadosProbablemente1Carrera: _.chain(
      stats.desgloseCarrerasPorEstudiante
    )
      .filter((d) => d.numCarreras !== "1")
      .map((d) => d.items)
      .flatten()
      .flatten()
      .map((d) => d.registros[0].mrun)
      .uniq()
      .filter((d) => !candidatosCambioCarrera.includes(d))
      .value()["length"],
    matriculadosMultiplesCarreras: _.chain(stats.desgloseCarrerasPorEstudiante)
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
<div class="card">

De los ${resumen.totalMatriculados} estudiantes matriculados en carreras profesionales universitarias:  
* ${d3.format(".1%")(resumen.matriculados1Carrera/resumen.totalMatriculados)} registraron matrícula en una única carrera dentro de la misma universidad.
* ${d3.format(".1%")(resumen.matriculadosProbablemente1Carrera/resumen.totalMatriculados)} iniciaron en programas como Plan Común de Ingeniería o Bachillerato, que no implican un cambio real de carrera.
* ${d3.format(".1%")(resumen.matriculadosMultiplesCarreras/resumen.totalMatriculados)} registraron matrícula en más de una carrera o en más de una universidad.

</div>

```js
const chartMismaCarrera = (() => {
  const dataPlot = _.chain(stats.data["1"])
    .map((d) => d.map((e) => e.registros))
    .flatten()
    .flatten()
    .sortBy((d) => `${d.area_carrera_generica}-${d.cod_inst}`)
    .value();

  return Plot.plot({
    x: { axis: "both", label:"Año" },
    y: { tickFormat: (d, i) => i+1, label: "Estudiante" },
    marks: [
      Plot.cell(dataPlot, {
        y: "mrun",
        x: "cat_periodo",
        fill: (d) => `${d.area_carrera_generica}-${d.cod_inst}`,
        tip: true,
        title: (d) => `${d.area_carrera_generica}\n${d.nomb_inst}`
      })
    ]
  });
})()
```

## Detalle de los registros de matrícula en carreras profesionales universidatrias entre 2015 y 2024
<div class="small muted"> Cada fila representa la matrícula de un(a) estudiante específica entre 2015 y 2024. Al pinchar en un rectángulo de color se mostrará la carrera y universidad correspondiente.</div>


<div class="card">

## Matrícula en la misma carrera y universidad a lo largo del tiempo 
${chartMismaCarrera}
</div>

<div class="card">  

## Casos de continuidad esperada
* Ingresaron a programas como Bachillerato, College o Plan Común de Ingeniería, que contemplan un cambio formal de carrera.
* Ejemplo: inicio en Ingeniería Plan Común y continuación en Ingeniería en la misma universidad.

${chartProbablementeMismaCarrera}  

</div>



<div class="card">

## Casos que corresponden a un cambio de carrera
* Matrícula en universidades diferentes.
* Matrícula en carreras distintas sin inicio en Bachillerato o Plan Común de Ingeniería.


${chartCambioCarrera} 

</div>



```js
const chartProbablementeMismaCarrera = (() => {
  const candidatosCambioCarrera = _.chain(stats.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => d.itemsConCambioCarrera)
    .flatten()
    .flatten()
    .map((d) => d.registros)
    .flatten()
    .map((d) => d.mrun)
    .value();

  const dataPlot = _.chain(stats.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => d.items)
    .flatten()
    .flatten()
    .map((d) => d.registros)
    .flatten()
    .filter((d) => !candidatosCambioCarrera.includes(d.mrun))
    .value();

  return dataPlot.length ? Plot.plot({
    x: { axis: "both", label:"Año" },
    y: { tickFormat: (d, i) => i+1, label: "Estudiante" },
    marks: [
      Plot.cell(dataPlot, {
        y: "mrun",
        x: "cat_periodo",
        fill: (d) => `${d.area_carrera_generica}-${d.cod_inst}`,
        tip: true,
        title: (d) => `${d.area_carrera_generica}\n${d.nomb_inst}`
      })
    ]
  }) : html`<h3>No hay registros en esta condición</h3>`;
})()
```

```js
const chartCambioCarrera = (() => {
  const candidatosCambioCarrera = _.chain(stats.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => d.itemsConCambioCarrera)
    .flatten()
    .flatten()
    .map((d) => d.registros)
    .flatten()
    .map((d) => d.mrun)
    .value();
  const dataPlot = _.chain(stats.desgloseCarrerasPorEstudiante)
    .filter((d) => d.numCarreras !== "1")
    .map((d) => d.itemsConCambioCarrera)
    .flatten()
    .flatten()
    .map((d) => d.registros)
    .flatten()
    .filter((d) => candidatosCambioCarrera.includes(d.mrun))
    .value();

  return Plot.plot({
    x: { axis: "both", label: "Año" },
    y: { tickFormat: (d, i) => i+1, label: "Estudiante" },
    marks: [
      Plot.cell(dataPlot, {
        y: "mrun",
        x: "cat_periodo",
        fill: (d) => `${d.area_carrera_generica}-${d.cod_inst}`,
        tip: true,
        title: (d) => `${d.area_carrera_generica}\n${d.nomb_inst}`
      })
    ]
  });
})()
```

```js
const stats = analisisTrayectorias(datosEstablecimiento)
```

```js
const datosComuna = [...await db.query(`
SELECT *
FROM datos
WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%'
`)]
```

```js
const datosEstablecimiento = [...await db.query(`
SELECT *
FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD} AND nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%'
`)]
```

```js
const universidadesComuna = [...await db.query(`
WITH tabla as (
SELECT DISTINCT mrun, nomb_inst
FROM datos)

SELECT nomb_inst, count(*) as estudiantes
FROM tabla
GROUP BY nomb_inst
ORDER BY estudiantes DESC
`)]
```


```js
const carrerasComuna = [...await db.query(`
WITH tabla as (SELECT mrun,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, count(*) as estudiantes
FROM datos
/* WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%' */
GROUP BY mrun, area_carrera_generica)

SELECT carrera, count(*)::Int as estudiantes 
FROM tabla
GROUP BY carrera
ORDER BY estudiantes DESC

`)]
```

```js
const carrerasComunaHombres = [...await db.query(`
WITH tabla as (SELECT mrun,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, count(*) as estudiantes
FROM datos
WHERE gen_alu = 1
/* WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%' */
GROUP BY mrun, area_carrera_generica)

SELECT carrera, count(*)::Int as estudiantes 
FROM tabla
GROUP BY carrera
ORDER BY estudiantes DESC

`)]
```

```js
const carrerasComunaMujeres = [...await db.query(`
WITH tabla as (SELECT mrun,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, count(*) as estudiantes
FROM datos
WHERE gen_alu = 2
/* WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%' */
GROUP BY mrun, area_carrera_generica)

SELECT carrera, count(*)::Int as estudiantes 
FROM tabla
GROUP BY carrera
ORDER BY estudiantes DESC

`)]
```


```js
const carrerasEstablecimiento = [...await db.query(`
WITH tabla as (SELECT mrun,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, count(*) as estudiantes
FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD}
/* WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%' */
GROUP BY mrun, area_carrera_generica)

SELECT carrera, count(*)::Int as estudiantes 
FROM tabla
GROUP BY carrera
ORDER BY estudiantes DESC

`)]
```

```js
const carrerasEstablecimientoHombres = [...await db.query(`
WITH tabla as (SELECT mrun,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, count(*) as estudiantes
FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD} AND gen_alu = 1
/* WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%' */
GROUP BY mrun, area_carrera_generica)

SELECT carrera, count(*)::Int as estudiantes 
FROM tabla
GROUP BY carrera
ORDER BY estudiantes DESC

`)]
```

```js
const carrerasEstablecimientoMujeres = [...await db.query(`
WITH tabla as (SELECT mrun,
  CASE WHEN area_carrera_generica like '%Ingeniería Civil%' OR area_carrera_generica like '%Ingenierías Civiles%' THEN 'Ingeniería Civil' ELSE area_carrera_generica END as carrera, count(*) as estudiantes
FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD} AND gen_alu = 2
/* WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%' */
GROUP BY mrun, area_carrera_generica)

SELECT carrera, count(*)::Int as estudiantes 
FROM tabla
GROUP BY carrera
ORDER BY estudiantes DESC

`)]
```


```js
const universidades = [...await db.query(`
WITH tabla as (
SELECT DISTINCT mrun, nomb_inst
FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD})

SELECT nomb_inst, count(*) as estudiantes
FROM tabla
GROUP BY nomb_inst
ORDER BY estudiantes DESC
`)]
```

```js
const cifrasTipoEdSuperior = [...await db.query(`WITH tabla as (SELECT mrun, count(*) as registros,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' THEN 1 ELSE 0 END)::Int as Universidad,
  SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' THEN 1 ELSE 0 END)::Int as IP,
  SUM(CASE WHEN tipo_inst_1 = 'Centros de Formación Técnica' THEN 1 ELSE 0 END)::Int as CFT,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' AND nivel_carrera_2 = 'Carreras Profesionales' THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Profesional,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' AND nivel_carrera_2 = 'Carreras Técnicas' THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Técnica,
    SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' AND nivel_carrera_2 = 'Carreras Profesionales' THEN 1 ELSE 0 END)::Int as IP_Carrera_Profesional,
  SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' AND nivel_carrera_2 = 'Carreras Técnicas' THEN 1 ELSE 0 END)::Int as IP_Carrera_Técnica,


FROM datos
WHERE RBD_EGRESO = ${establecimientoSeleccionado.RBD} AND nivel_global = 'Pregrado'
GROUP BY mrun)

SELECT 
SUM(CASE WHEN registros > 0 THEN 1 ELSE 0 END)::Int as total,
SUM(CASE WHEN Universidad > 0 THEN 1 ELSE 0 END)::Int as Universidad,
SUM(CASE WHEN IP > 0 THEN 1 ELSE 0 END)::Int as IP,
SUM(CASE WHEN CFT > 0 THEN 1 ELSE 0 END)::Int as CFT,
SUM(CASE WHEN Universidad_Carrera_Profesional > 0 THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Profesional,
SUM(CASE WHEN Universidad_Carrera_Técnica > 0 THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Técnica,
SUM(CASE WHEN IP_Carrera_Profesional > 0 THEN 1 ELSE 0 END)::Int as IP_Carrera_Profesional,
SUM(CASE WHEN IP_Carrera_Técnica > 0 THEN 1 ELSE 0 END)::Int as IP_Carrera_Técnica,

FROM tabla`)]
```

```js
const cifrasTipoEdSuperiorPorEstablecimiento = [...await db.query(`WITH tabla as (SELECT mrun, RBD_EGRESO, NOM_RBD, COD_DEPE2,count(*) as registros,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' THEN 1 ELSE 0 END)::Int as Universidad,
  SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' THEN 1 ELSE 0 END)::Int as IP,
  SUM(CASE WHEN tipo_inst_1 = 'Centros de Formación Técnica' THEN 1 ELSE 0 END)::Int as CFT,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' AND nivel_carrera_2 = 'Carreras Profesionales' THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Profesional,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' AND nivel_carrera_2 = 'Carreras Técnicas' THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Técnica,
    SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' AND nivel_carrera_2 = 'Carreras Profesionales' THEN 1 ELSE 0 END)::Int as IP_Carrera_Profesional,
  SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' AND nivel_carrera_2 = 'Carreras Técnicas' THEN 1 ELSE 0 END)::Int as IP_Carrera_Técnica,


FROM datos
WHERE nivel_global = 'Pregrado'
GROUP BY mrun, RBD_EGRESO, NOM_RBD, COD_DEPE2)

SELECT tabla.RBD_EGRESO, tabla.NOM_RBD, tabla.COD_DEPE2, MAX(establecimientos.numeroEstudiantes)::Int as estudiantesEgresados,
SUM(CASE WHEN registros > 0 THEN 1 ELSE 0 END)::Int as total,
SUM(CASE WHEN Universidad > 0 THEN 1 ELSE 0 END)::Int as Universidad,
SUM(CASE WHEN IP > 0 THEN 1 ELSE 0 END)::Int as IP,
SUM(CASE WHEN CFT > 0 THEN 1 ELSE 0 END)::Int as CFT,
SUM(CASE WHEN Universidad_Carrera_Profesional > 0 THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Profesional,
SUM(CASE WHEN Universidad_Carrera_Técnica > 0 THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Técnica,
SUM(CASE WHEN IP_Carrera_Profesional > 0 THEN 1 ELSE 0 END)::Int as IP_Carrera_Profesional,
SUM(CASE WHEN IP_Carrera_Técnica > 0 THEN 1 ELSE 0 END)::Int as IP_Carrera_Técnica,

FROM tabla
LEFT JOIN establecimientos ON tabla.RBD_EGRESO = establecimientos.RBD
GROUP BY tabla.RBD_EGRESO, tabla.NOM_RBD, tabla.COD_DEPE2`)]
```

```js
const cifrasTipoEdSuperiorComuna = [...await db.query(`WITH tabla as (SELECT mrun, count(*) as registros,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' THEN 1 ELSE 0 END)::Int as Universidad,
  SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' THEN 1 ELSE 0 END)::Int as IP,
  SUM(CASE WHEN tipo_inst_1 = 'Centros de Formación Técnica' THEN 1 ELSE 0 END)::Int as CFT,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' AND nivel_carrera_2 = 'Carreras Profesionales' THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Profesional,
  SUM(CASE WHEN tipo_inst_1 = 'Universidades' AND nivel_carrera_2 = 'Carreras Técnicas' THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Técnica,
    SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' AND nivel_carrera_2 = 'Carreras Profesionales' THEN 1 ELSE 0 END)::Int as IP_Carrera_Profesional,
  SUM(CASE WHEN tipo_inst_1 = 'Institutos Profesionales' AND nivel_carrera_2 = 'Carreras Técnicas' THEN 1 ELSE 0 END)::Int as IP_Carrera_Técnica,


FROM datos
WHERE nivel_global = 'Pregrado'
GROUP BY mrun)

SELECT 
SUM(CASE WHEN registros > 0 THEN 1 ELSE 0 END)::Int as total,
SUM(CASE WHEN Universidad > 0 THEN 1 ELSE 0 END)::Int as Universidad,
SUM(CASE WHEN IP > 0 THEN 1 ELSE 0 END)::Int as IP,
SUM(CASE WHEN CFT > 0 THEN 1 ELSE 0 END)::Int as CFT,
SUM(CASE WHEN Universidad_Carrera_Profesional > 0 THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Profesional,
SUM(CASE WHEN Universidad_Carrera_Técnica > 0 THEN 1 ELSE 0 END)::Int as Universidad_Carrera_Técnica,
SUM(CASE WHEN IP_Carrera_Profesional > 0 THEN 1 ELSE 0 END)::Int as IP_Carrera_Profesional,
SUM(CASE WHEN IP_Carrera_Técnica > 0 THEN 1 ELSE 0 END)::Int as IP_Carrera_Técnica,

FROM tabla`)]
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

```js
function getRemoteFile(url) {
  const baseURL = new URL(url);
  return {
    file: {
      name: baseURL.pathname,
      url: function () {
        return url;
      }
    }
  };
}
```

```js
function analisisTrayectorias(data) {
  function carreras(items) {
    return _.chain(items)
      .groupBy((d) => `${d.area_carrera_generica}-${d.nomb_inst}`)
      .map((items, key) => ({ carrera: key, registros: items }))
      .value();
  }

  function findIngPlanComunMismaU(items) {
    return items.filter((d) => {
      const primeraCarrera = _.first(d);
      const otrasCarreras = _.slice(d, 1, d.length);

      const primeraCarreraPlanComun = primeraCarrera.carrera.match(
        /Ingeniería Civil, plan común/
      );
      const otrasCarrerasIngenieria = otrasCarreras.reduce(
        (memo, e) => memo && e.carrera.match(/Ingeniería Civil|Ingenierías Civiles|Física y Astronomía|Geología|Geofísica/),
        true
      );

      const otrasCarrerasMismaUniversidad = otrasCarreras.reduce(
        (memo, e) =>
          memo &&
          e.registros[0].cod_inst == primeraCarrera.registros[0].cod_inst,
        true
      );

      return (
        primeraCarreraPlanComun &&
        otrasCarrerasIngenieria &&
        otrasCarrerasMismaUniversidad
      );
    });
  }

  function findBachilleratoMismaU(items) {
    return items.filter((d) => {
      const primeraCarrera = _.first(d);
      const otrasCarreras = _.slice(d, 1, d.length);

      const primeraCarreraBachilerato =
        primeraCarrera.carrera.match(/Bachillerato/);

      const otrasCarrerasMismaUniversidad = otrasCarreras.reduce(
        (memo, e) =>
          memo &&
          e.registros[0].cod_inst == primeraCarrera.registros[0].cod_inst,
        true
      );

      return primeraCarreraBachilerato && otrasCarrerasMismaUniversidad;
    });
  }

  const porEstudiante = _.chain(data)
    .groupBy((d) => d.mrun)
    .map((items, key) => ({ mrun: key, registros: items }))
    .value();

  const carrerasPorEstudiante = porEstudiante.map((d) => carreras(d.registros));

  const desgloseCarrerasPorEstudiante = _.chain(carrerasPorEstudiante)
    .groupBy((d) => d.length)
    .map((items, key) => ({
      numCarreras: key,
      numEstudiantes: items.length,
      items: items,
      itemsConCambioCarrera: items.filter(
        (d) =>
          !findIngPlanComunMismaU(items).includes(d) &&
          !findBachilleratoMismaU(items).includes(d) &&
          key !== "1"
      ),

      items_IngPlanComun: findIngPlanComunMismaU(items),
      items_Bachillerato: findBachilleratoMismaU(items),

      ingenieriaPlanComun: findIngPlanComunMismaU(items).length,
      bachillerato: findBachilleratoMismaU(items).length,

      carreras: _.chain(items)
        .map((item) => ({
          carreras: _.chain(item)
            .map((d) => d.registros[0])
            .map((d) => d.area_carrera_generica)
            .join("|")
            .value(),
          item: item
        }))
        .groupBy((d) => d.carreras)
        .map((items, key) => ({
          carrras: key,
          numEstudiantes: items.length,
          registros: items
        }))
        .orderBy((d) => d.numEstudiantes)
        .reverse()
        .value()
    }))
    .value();

  function cambioDeCarrera(desgloseCarrerasPorEstudiante) {
    return desgloseCarrerasPorEstudiante
      .filter((d) => d.numCarreras !== "1")
      .reduce(
        (memo, d) =>
          memo + d.numEstudiantes - d.ingenieriaPlanComun - d.bachillerato,
        0
      );
  }

  return {
    data: _.chain(carrerasPorEstudiante)
      .groupBy((d) => d.length)
      .value(),
    numeroEstudiantesConMatricula: porEstudiante.length,
    desgloseCarrerasPorEstudiante: desgloseCarrerasPorEstudiante,
    estudiantesConCambioCarrera: cambioDeCarrera(desgloseCarrerasPorEstudiante)
  };
}
```

```js
const dictComunas = (() => {
  const dict = {};

  _.chain([...establecimientos])
    .groupBy((d) => d.NOM_COM_RBD)
    .map((items, key) => ({
      NOM_COM_RBD: key,
      numeroEstudiantes: items.reduce(
        (memo, d) => memo + d.numeroEstudiantes,
        0
      )
    }))
    .each((d) => (dict[d.NOM_COM_RBD] = d.numeroEstudiantes))
    .value();

  return dict;
})()
```
## ¿Por qué explorar estos datos?

Este análisis descriptivo permite observar patrones iniciales en las trayectorias de los estudiantes egresados, como:

- Qué carreras e instituciones son más comunes.
- Cuántos estudiantes permanecen en la misma carrera y cuántos cambian.
- Tendencias generales en la matrícula de Educación Superior.

Si bien esta es solo una exploración preliminar, los resultados pueden inspirar análisis más detallados en el futuro para comprender mejor las dinámicas educativas en Chile.

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

```js
const areaCarreraGenerica = [...await db.query(`
SELECT area_carrera_generica, nomb_carrera,nomb_inst, count(*) as records
FROM datos
WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%'
GROUP BY area_carrera_generica, nomb_carrera, nomb_inst
ORDER BY area_carrera_generica,nomb_inst
`)]
```
```js
import {require} from "npm:d3-require";
```
```js
const d3Sankey = require.alias({"d3-array": d3, "d3-shape": d3, "d3-sankey": "d3-sankey@0.12.3/dist/d3-sankey.min.js"})("d3-sankey")
```
```js
display(d3Sankey)
```
<script src="https://unpkg.com/d3-sankey@0"></script>


```js
// Copyright 2021-2023 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/sankey-diagram
function SankeyChart({
  nodes, // an iterable of node objects (typically [{id}, …]); implied by links if missing
  links // an iterable of link objects (typically [{source, target}, …])
}, {
  format = ",", // a function or format specifier for values in titles
  align = "justify", // convenience shorthand for nodeAlign
  nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  nodeGroups, // an array of ordinal values representing the node groups
  nodeLabel, // given d in (computed) nodes, text to label the associated rect
  nodeTitle = d => `${d.id}\n${format(d.value)}`, // given d in (computed) nodes, hover text
  nodeAlign = align, // Sankey node alignment strategy: left, right, justify, center
  nodeSort, // comparator function to order nodes
  nodeWidth = 15, // width of node rects
  nodePadding = 10, // vertical separation between adjacent nodes
  nodeLabelPadding = 6, // horizontal separation between node and label
  nodeStroke = "currentColor", // stroke around node rects
  nodeStrokeWidth, // width of stroke around node rects, in pixels
  nodeStrokeOpacity, // opacity of stroke around node rects
  nodeStrokeLinejoin, // line join for stroke around node rects
  linkSource = ({source}) => source, // given d in links, returns a node identifier string
  linkTarget = ({target}) => target, // given d in links, returns a node identifier string
  linkValue = ({value}) => value, // given d in links, returns the quantitative value
  linkPath = d3Sankey.sankeyLinkHorizontal(), // given d in (computed) links, returns the SVG path
  linkTitle = d => `${d.source.id} → ${d.target.id}\n${format(d.value)}`, // given d in (computed) links
  linkColor = "source-target", // source, target, source-target, or static color
  linkStrokeOpacity = 0.5, // link stroke opacity
  linkMixBlendMode = "multiply", // link blending mode
  colors = d3.schemeTableau10, // array of colors
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  marginTop = 5, // top margin, in pixels
  marginRight = 1, // right margin, in pixels
  marginBottom = 5, // bottom margin, in pixels
  marginLeft = 1, // left margin, in pixels
} = {}) {
  // Convert nodeAlign from a name to a function (since d3-sankey is not part of core d3).
  if (typeof nodeAlign !== "function") nodeAlign = {
    left: d3Sankey.sankeyLeft,
    right: d3Sankey.sankeyRight,
    center: d3Sankey.sankeyCenter
  }[nodeAlign] ?? d3Sankey.sankeyJustify;

  // Compute values.
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  const LV = d3.map(links, linkValue);
  if (nodes === undefined) nodes = Array.from(d3.union(LS, LT), id => ({id}));
  const N = d3.map(nodes, nodeId).map(intern);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);

  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
  links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i], value: LV[i]}));

  // Ignore a group-based linkColor option if no groups are specified.
  if (!G && ["source", "target", "source-target"].includes(linkColor)) linkColor = "currentColor";

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = G;

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  // Compute the Sankey layout.
  d3Sankey.sankey()
      .nodeId(({index: i}) => N[i])
      .nodeAlign(nodeAlign)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .nodeSort(nodeSort)
      .extent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
    ({nodes, links});

  // Compute titles and labels using layout nodes, so as to access aggregate values.
  if (typeof format !== "function") format = d3.format(format);
  const Tl = nodeLabel === undefined ? N : nodeLabel == null ? null : d3.map(nodes, nodeLabel);
  const Tt = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const Lt = linkTitle == null ? null : d3.map(links, linkTitle);

  // A unique identifier for clip paths (to avoid conflicts).
  const uid = `O-${Math.random().toString(16).slice(2)}`;

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const node = svg.append("g")
      .attr("stroke", nodeStroke)
      .attr("stroke-width", nodeStrokeWidth)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-linejoin", nodeStrokeLinejoin)
    .selectAll("rect")
    .data(nodes)
    .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0);

  if (G) node.attr("fill", ({index: i}) => color(G[i]));
  if (Tt) node.append("title").text(({index: i}) => Tt[i]);

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", linkStrokeOpacity)
    .selectAll("g")
    .data(links)
    .join("g")
      .style("mix-blend-mode", linkMixBlendMode);

  if (linkColor === "source-target") link.append("linearGradient")
      .attr("id", d => `${uid}-link-${d.index}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => d.source.x1)
      .attr("x2", d => d.target.x0)
      .call(gradient => gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", ({source: {index: i}}) => color(G[i])))
      .call(gradient => gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", ({target: {index: i}}) => color(G[i])));

  link.append("path")
      .attr("d", linkPath)
      .attr("stroke", linkColor === "source-target" ? ({index: i}) => `url(#${uid}-link-${i})`
          : linkColor === "source" ? ({source: {index: i}}) => color(G[i])
          : linkColor === "target" ? ({target: {index: i}}) => color(G[i])
          : linkColor)
      .attr("stroke-width", ({width}) => Math.max(1, width))
      .call(Lt ? path => path.append("title").text(({index: i}) => Lt[i]) : () => {});

  if (Tl) svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 20)
    .selectAll("text")
    .data(nodes)
    .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + nodeLabelPadding : d.x0 - nodeLabelPadding)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(({index: i}) => Tl[i]);

  function intern(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  return Object.assign(svg.node(), {scales: {color}});
}
```

