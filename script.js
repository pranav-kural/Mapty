'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// DOM elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//////////////////////////////////////////////////////
// App architecture

class App {
  #map;
  #mapEvent;

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
      alert('Could not get your position')
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    this.#map = L.map('map').setView([latitude, longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // map click event handler
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(event) {
    // display the form for entering details about activity at the location clicked at
    form.classList.remove('hidden');
    inputDistance.focus();
    // update global state
    console.log(event);
    this.#mapEvent = event;
    // display empty marker
    L.marker([this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng])
      .addTo(this.#map)
      .bindPopup('Enter activity details')
      .openPopup();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // prevent page reload on submit
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = inputDistance.value;
    const duration = inputDuration.value;
    const cadence = inputCadence.value || 0;
    const elevation = inputElevation.value || 0;

    // Check if data is valid
    // prettier-ignore
    if (!this._validateWorkoutData(type, distance, duration, cadence, elevation))
      return;

    // If workout running, create running object
    console.log('success');
    // If workout type is cycling, create cycling object

    // Add new object to workout array

    // Render workout on map as a marker
    L.marker([this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        }).setContent(`Ran ${inputDistance.value} here!`)
      )
      .openPopup();

    // Render workout on list

    // Hide form + clear input fields

    form.classList.add('hidden');
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
  }

  // validate form input
  _validateWorkoutData(type, distance, duration, cadence, elevation) {
    const validationCheck =
      [distance, duration, type === 'running' ? cadence : 0].every(
        val => Number.isFinite(Number.parseFloat(val)) && val >= 0
      ) &&
      Number.isFinite(Number.parseFloat(type === 'cycling' ? elevation : 0));
    // check if all values are valid numbers
    if (!validationCheck) {
      alert('Inputs have to be positive number!');
      return false;
    }
  }
}

//////////////////////////////////////////////////////
// Workout Classes

class Workout {
  constructor(coords, distance, duration) {
    this.id = (Date.now() + '').slice(-10);
    this.date = new Date();
    this.coords = coords;
    this.distance = distance; // in KM
    this.duration = duration; // in minutes
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

if (navigator.geolocation) {
  const app = new App();
} else alert('Geolocation API not available!');
