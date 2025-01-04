---
toc: false

sql:
  comunas: ./data/comunas.json
---

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
  display(window.location.href + `comuna/${comuna}`)
  window.location.href = window.location.href + `comuna/${comuna}`;
}
```

