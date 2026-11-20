import { render } from 'preact'
import '@fontsource/rubik/latin-400.css'
import '@fontsource/rubik/latin-500.css'
import '@fontsource/rubik/latin-600.css'
import '@fontsource/rubik/latin-700.css'
import './styles.css'
import { App } from './App.jsx'

render(<App />, document.getElementById('app'))
