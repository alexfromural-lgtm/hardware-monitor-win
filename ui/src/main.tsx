import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import { client } from './graphql/client'
import { DisplaySettingsProvider } from './store/displaySettings'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <DisplaySettingsProvider>
        <App />
      </DisplaySettingsProvider>
    </ApolloProvider>
  </StrictMode>,
)

