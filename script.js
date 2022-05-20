'use strict';

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
  #workouts = [];
  #defaultZoom = 16;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
      alert('Could not get your position')
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    this.#map = L.map('map').setView([latitude, longitude], this.#defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // map click event handler
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }

  _showForm(event) {
    // display the form for entering details about activity at the location clicked at
    form.classList.remove('hidden');
    inputDistance.focus();
    // update App state
    this.#mapEvent = event;
    // display empty marker
    L.marker([this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng])
      .addTo(this.#map)
      .bindPopup('Enter activity details')
      .openPopup();
  }

  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
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
    const { lat, lng } = this.#mapEvent.latlng;
    const currentCoords = [lat, lng];
    let workout;

    // Check if data is valid
    // prettier-ignore
    if (!this._validateWorkoutData(type, distance, duration, cadence, elevation))
      return;

    if (type === 'running') {
      // If workout running, create running object
      workout = new Running(currentCoords, distance, duration, cadence);
    } else if (type === 'cycling') {
      // If workout type is cycling, create cycling object
      workout = new Cycling(currentCoords, distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as a marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage for all workouts
    this._setLocalStorage();
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
    // return validation result
    return validationCheck;
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(
          `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
        )
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const workoutHTML = this._generateWorkoutHTML(workout);

    form.insertAdjacentHTML('afterend', workoutHTML);
  }

  _generateWorkoutHTML(workout) {
    return `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${(workout.type === 'running'
        ? workout.pace
        : workout.speed
      ).toFixed(1)}</span>
      <span class="workout__unit">${
        workout.type === 'running' ? 'min/km' : 'km/h'
      }</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🦶🏼' : '⛰'
      }</span>
      <span class="workout__value">${
        workout.type === 'running' ? workout.cadence : workout.elevation
      }</span>
      <span class="workout__unit">${
        workout.type === 'running' ? 'spm' : 'm'
      }</span>
    </div>
  </li>
    `;
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#defaultZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workouts'));

    if (!workouts) return;

    this.#workouts = workouts;

    this.#workouts.forEach(workout => this._renderWorkout(workout));
  }

  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

//////////////////////////////////////////////////////
// Workout Classes

class Workout {
  constructor(coords, type, distance, duration) {
    this.id = (Date.now() + '').slice(-10);
    this.date = new Date();
    this.coords = coords;
    this.type = type; // type of workout
    this.distance = distance; // in KM
    this.duration = duration; // in minutes
    this._setDescription();
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, 'running', distance, duration);
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
    super(coords, 'cycling', distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
let app;
if (navigator.geolocation) {
  app = new App();
} else alert('Geolocation API not available!');
