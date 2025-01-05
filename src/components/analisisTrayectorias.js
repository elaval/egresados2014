import _ from "npm:lodash";

export function analisisTrayectorias(data) {
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