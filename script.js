'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

navigator.geolocation.getCurrentPosition(
  pos => {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    // render leaflet interactive map
    leafletMap(latitude, longitude);
  },
  () => alert('Could not get your position')
);

const leafletMap = function (latitude, longitude) {
  // render map
  const map = renderMap(latitude, longitude);

  // map click event handler
  map.on('click', mapEvent => mapClickHandler(mapEvent, map));
};

const renderMap = (latitude, longitude) => {
  const map = L.map('map').setView([latitude, longitude], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  return map;
};

const mapClickHandler = (mapEvent, map) => {
  L.marker([mapEvent.latlng.lat, mapEvent.latlng.lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      }).setContent('Ran here!')
    )
    .openPopup();
};
