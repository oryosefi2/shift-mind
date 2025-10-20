import ReactDOM from 'react-dom/client'
import App from './App'
import './index-simple.css'

console.log('main.tsx is loading...')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
} else {
  const root = ReactDOM.createRoot(rootElement)
  console.log('ReactDOM root created')
  
  root.render(<App />)
  console.log('App rendered')
}
