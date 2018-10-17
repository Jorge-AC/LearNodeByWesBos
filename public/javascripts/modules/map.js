import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: {
    lat: 43.2,
    lng: -79.8
  },
  zoom: 10
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/v1/stores/near?lat=${lat}&lng=${lng}`).then(response => {
    if (!response.data.length) {
      alert('No places where found');
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = response.data.map(place => {
      const [placeLng, placeLat] = place.location.coordinates;
      const marker = new google.maps.Marker({ position: { lng: placeLng, lat: placeLat }, map });

      marker.place = place;
      bounds.extend(marker.getPosition());

      return marker;
    });

    markers.forEach(marker => {
      marker.addListener('click', function() {
        const html = `
        <div class="popup">
          <a href="/store/${this.place.slug}">
            <img src="/uploads/${this.place.photo || 'store.png'}" alt="image of ${
          this.place.name
        }" />
            <p> ${this.place.name} - ${this.place.location.address}</p>
          </a>
        </div>`;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      });
    });

    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;

  const map = new google.maps.Map(mapDiv, mapOptions);
  const autocomplete = new google.maps.places.Autocomplete($('[name=geolocate]'));

  loadPlaces(map);

  autocomplete.addListener('place_changed', function(e) {
    const place = autocomplete.getPlace();

    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;
