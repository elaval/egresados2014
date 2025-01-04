---
toc: false

sql:
  establecimientos: ./NEM_PERCENTILES_AGGREGATED.parquet
  comunas: ./data/comunas.json
---
# Matrícula en carreras universitarias según establecimiento de egreso

```sql id=comunas
SELECT *
FROM comunas
```


```js
async function getUserComuna() {
  try {
    // Fetch user location data from ipapi
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data && data.region && data.city) {
      // Use the region and city data (includes comuna)
      console.log(`User is in: ${data.city}, ${data.region}`);
      // You can set this as the default in your application
      return data.city;
    } else {
      console.error("Could not retrieve location data");
    }
  } catch (error) {
    console.error("Error fetching location data:", error);
  }
}
```

```js
const comunaBrowser = await getUserComuna()
```
```js
const comuna = [...comunas].map(d => d.comuna).includes(comunaBrowser.toUpperCase()) 
  ? comunaBrowser.toUpperCase() 
  : 'SANTIAGO'

```
```js
if (comuna) {
  display(comuna)
  window.location.href = `/comuna/${comuna}`;

}
```

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

## ${establecimientoSeleccionado.NOM_RBD} (${aliasDependencia[establecimientoSeleccionado.COD_DEPE2]})
### ${comunaSeleccionada.comuna}

<div class="card" style="padding: 10;">  

## Resumen General

En ${establecimientoSeleccionado.NOM_RBD}, egresaron ${
    establecimientoSeleccionado.numeroEstudiantes
  } estudiantes en 2014.

Entre 2015 y 2024:
* ${statsEstablecimiento.totalEdSuperior} (${d3.format(".1%")(statsEstablecimiento.totalEdSuperior/establecimientoSeleccionado.numeroEstudiantes)}) se matricularon en alguna carrera de Educación Superior.
  * ${statsEstablecimiento.totalUniversidad} en Universidades ${statsEstablecimiento.totalUniversidad_Carrera_Profesional == statsEstablecimiento.totalUniversidad ? `en carreras profesionales` : `(${statsEstablecimiento.totalUniversidad_Carrera_Profesional} en carreras profesionales)`}.
  * ${statsEstablecimiento.totalIP} en Institutos Profesionales ${statsEstablecimiento.totalIP_Carrera_Profesional == statsEstablecimiento.totalIP ? `en carreras profesionales` : `(${statsEstablecimiento.totalIP_Carrera_Profesional} en carreras profesionales)`}.
  * ${statsEstablecimiento.totalCFT} en Centros de Formación Técnica.




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

```js
(() => {
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

  const yDomain = [
    "Educación Superior",
    "Universidad",
    "Universidad (Carrera Profesional)",
    "Universidad (Carrera Técnica)",
    "IP (Carrera Profesional)",
    "IP (Carrera Técnica)",
    "CFT"
  ];

  //return yDomain.indexOf("Universidad");
  const dataPlot = [
    {
      tipo: "Egresados Ed Media (2014)",
      valor: establecimientoSeleccionado.numeroEstudiantes,
      categoria: "egresados"
    },
    {
      tipo: "Educación Superior",
      valor: totalEdSuperior,
      categoria: "tipoIE"
    },
    { tipo: "Universidad", valor: totalUniversidad, categoria: "tipoIE" },
    {
      tipo: "Universidad (Carrera Profesional)",
      valor: totalUniversidad_Carrera_Profesional,
      categoria: "tipoCarrera"
    },
    {
      tipo: "Universidad (Carrera Técnica)",
      valor: totalUniversidad_Carrera_Técnica,
      categoria: "tipoCarrera"
    },
    {
      tipo: "Instituto Profesional (IP)",
      valor: totalIP,
      categoria: "tipoIE"
    },
    {
      tipo: "IP (Carrera Profesional)",
      valor: totalIP_Carrera_Profesional,
      categoria: "tipoCarrera"
    },
    {
      tipo: "IP (Carrera Técnica)",
      valor: totalIP_Carrera_Técnica,
      categoria: "tipoCarrera"
    },
    {
      tipo: "CFT",
      valor: totalCFT,
      categoria: "tipoIE"
    }
  ].filter((d) => d.valor > 0);

  return Plot.plot({
    color: {
      domain: ["egresados", "tipoIE", "tipoCarrera"],
      range: [d3.schemeObservable10[1], d3.schemeObservable10[0], "lightgrey"]
    },
    y: { domain: dataPlot.map((d) => d.tipo), label: "" },
    marginLeft: 180,
    marginRight: 30,
    caption:
      "Nota: puede haber matriculas de la misma persona en más de un tipo de Institución/Carrera, por lo que las sumas de las cifras parciales pueden no coincidir con los subtotales y el total en Educación Superior.",
    marks: [
      Plot.barX(dataPlot, {
        x: "valor",
        y: "tipo",
        fill: "categoria"
      }),
      Plot.text(dataPlot, {
        x: "valor",
        y: "tipo",
        text: "valor",
        textAnchor: "start",
        dx: 5
      }),
      Plot.ruleX([0])
    ]
  });
})()
```

</div>

## Las 5 carreras e instituciones más frecuentes
<div class="small muted">Distintas especialidades de Ingeniería Civil se agrupan como "Ingeniería Civil".</div>

<div class="grid grid-cols-2">
<div class="card" style="padding: 10;">  

## Carreras  
${carreras.slice(0,5).map(d => html`<li> ${d.carrera} (${d.estudiantes} estudiantes)`)}
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

```sql id=establecimientos
SELECT * 
FROM establecimientos
```

```js
const datosEstablecimiento = [...await db.query(`
SELECT *
FROM datos
WHERE nivel_global = 'Pregrado' AND tipo_inst_1 = 'Universidades' AND nivel_carrera_2 like '%Carreras Profesionales%'
`)]
```

```js
const carreras = [...await db.query(`
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
const universidades = [...await db.query(`
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
const cifrasTipoEdSuperior = [...await db.query(`WITH tabla as (SELECT mrun, count(*) as registros,
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
const db = DuckDBClient.of({});
```
```js
display( await db.query(`SELECT count(*) from './data/Por establecimiento/${establecimientoSeleccionado.RBD}.parquet'`))
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
