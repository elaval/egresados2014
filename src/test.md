---
toc: false

sidebar: false
header: false
footer: false
pager: false

---


```js
const listaComunas = FileAttachment(`./data/comunas.json`).json()
```

```js
const comuna = listaComunas && _.chain(listaComunas).sortBy(d => d.numeroEstudiantes).reverse().slice(0,20).sample().value()["comuna"] || null
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
//const comunaBrowser = await getUserComuna()
```
```js
/*
const comuna = comlist.map(d => d.comuna).includes(comunaBrowser.toUpperCase()) 
  ? comunaBrowser.toUpperCase() 
  : 'SANTIAGO'
  */
```

<!-- JavaScript code to reset the loaded state if there are any establecimientos -->
```js
/*
if ([...comunas].length > 0) {
  reset()
}
*/
```

<!-- JavaScript code to define a mutable state 'loaded' and a reset function to set 'loaded' to true -->
```js
/*
const loaded = Mutable(false);
const reset = () => loaded.value = true;
*/
```

```js
if (comuna) {
  window.location.href = window.location.href + `comuna/${comuna}`;
}
```



${comuna ? `Redirigiendo a pagina con datos para comuna de ${comuna}` : "Cargando daos ..."}





