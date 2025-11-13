import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import './index.css'
import type { Listing, User } from './types'
import { clearUser, getCurrentUser, getListings, seedListingsIfNeeded } from './storage'
import { generateMockListings } from './mockListings'
import { ListingCard } from './components/NewListingCard'
import Filters, { type FiltersState } from './components/Filters'
import { fetchListings, hasApi } from './api'
import { updateListings } from './app.util'

// API URL from environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Box, Typography, TextField, Button, Paper, Container, Tabs, Tab, MenuItem, Alert } from '@mui/material'
import { lightBlue } from '@mui/material/colors'
import { validateName, validateAge, validateEmployer, validatePasswordComplexity} from './validation'


type AuthView = 'login' | 'signup'

export default function App() {
  const [authView, setAuthView] = useState<AuthView>('login')
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const [listings, setListings] = useState<Listing[]>([])
  const [filters, setFilters] = useState<FiltersState>({
    city: '',
    minPrice: 0,
    maxPrice: 0,
    beds: '',
    sort: 'priceAsc',
  })

  useEffect(() => {
    const run = async () => {
      if (hasApi) {
        try {
          const list = await fetchListings()
          setListings(list)
          return
        } catch (e) {
          console.warn('API fetch failed, falling back to local data', e)
        }
      }
      seedListingsIfNeeded(generateMockListings(48))
      setListings(getListings())
    }
    run()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(`${API_URL}/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Unauthorized') // authorize the user
          return res.json()
        })
        .then(data => {
          setUser(data.user) 
        })
        .catch(() => {
          localStorage.removeItem('authToken') 
        })
    }
  }, [])

  const onLogout = () => {
    clearUser()
    setUser(null)
  }

  const filtered = useMemo(() => updateListings(listings, filters), [listings, filters])

  if (!user) return <AuthShell view={authView} setView={setAuthView} onAuthed={setUser} />

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      <Header user={user} onLogout={onLogout} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          maxWidth: 1440,
          width: '100%',
          margin: '24px auto 0 auto',
        }}
      >
        <Filters cities={listings.map(l => l.city)} onChange={setFilters} />
        <div>
          {filtered.length > 0 && (
            <>
              <Typography sx={{ textAlign: 'left', color: 'black' }} variant="h4">
                {`Results (${filtered.length})`}
              </Typography>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 400px)',
                  gridTemplateRows: '350px 350px',
                  gridGap: '16px',
                }}
              >
                {filtered.map(l => (
                  <Box sx={{ placeSelf: 'center' }}>
                    <ListingCard key={l.id} listing={l} />
                  </Box>
                ))}
              </div>
            </>
          )}
          {filtered.length === 0 && (
            <Typography
              style={{ opacity: 0.7, marginTop: 20, color: 'black', textAlign: 'left' }}
              variant="h3"
            >
              No results. Try broadening your filters.
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}

/* Header for the entire website */
function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        top: 0,
        background: 'white',
        padding: '12px 24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '25px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AcUnitIcon sx={{ color: lightBlue['A400'], height: '36px', width: '36px' }} />
          <Typography variant="h5" sx={{ color: 'black' }}>
            RoomieMatch
          </Typography>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
          }}
        >
          <Typography variant="h6" sx={{ color: 'black', fontSize: '16px' }}>
            Home
          </Typography>
          <Typography variant="h6" sx={{ color: 'black', fontSize: '16px' }}>
            Explore
          </Typography>
          <Typography variant="h6" sx={{ color: 'black', fontSize: '16px' }}>
            Messages
          </Typography>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ opacity: 0.8, color: 'black' }}>
          {user.name} • {user.employer}
        </span>
        <button style={{ backgroundColor: 'white', color: 'black' }} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

function AuthShell({
  view,
  setView,
  onAuthed,
}: {
  view: AuthView
  setView: (v: AuthView) => void
  onAuthed: (u: User) => void
}) {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#F5F5F5'
    }}>
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'white'
        }}>
          {/* Logo Header */}
          <Box sx={{ 
            p: 4, 
            pb: 2,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1.5
          }}>
            <AcUnitIcon sx={{ color: lightBlue['A400'], fontSize: 48 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#333' }}>
              RoomieMatch
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={view} 
              onChange={(_, v) => setView(v)}
              centered
              sx={{
                '& .MuiTab-root': { 
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minWidth: 120
                }
              }}
            >
              <Tab label="Login" value="login" />
              <Tab label="Sign Up" value="signup" />
            </Tabs>
          </Box>

          {/* Forms */}
          <Box sx={{ p: 4 }}>
            {view === 'login' ? <LoginForm onAuthed={onAuthed} /> : <SignupForm onAuthed={onAuthed} />}
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}


function LoginForm({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [form, setForm] = useState({ name: '', password: '' })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/login`, { // hit the login endpoint which should verify the user and passcode pushed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('Login failed')
      const { token, user } = await response.json()
      localStorage.setItem('authToken', token) 
      onAuthed(user)
    } catch (error) {
      console.error(error)
      alert('Invalid credentials')
    }
  }

  return (
    <form onSubmit={submit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
          Welcome back
        </Typography>
        
        <TextField
          label="Name"
          value={form.name}
          onChange={e=>setForm(f=>({ ...f, name:e.target.value }))}
          fullWidth
          required
          variant="outlined"
        />
        
        <TextField
          label="Passcode"
          type="password"
          value={form.password}
          onChange={e=>setForm(f=>({ ...f, password:e.target.value }))}
          fullWidth
          required
          variant="outlined"
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          fullWidth
          sx={{ 
            mt: 1,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
            }
          }}
        >
          Sign In
        </Button>
      </Box>
    </form>
  )
}


function SignupForm({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [form, setForm] = useState({ 
    name: '', 
    password: '', 
    employer: '',
    age: '',
    gender: ''
  })
  
  // validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // UI help
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    let validation: { valid: boolean; error?: string }
    
    switch (field) {
      case 'name':
        validation = validateName(value)
        break
      case 'age':
        validation = validateAge(value)
        break
      case 'employer':
        validation = validateEmployer(value)
        break
      case 'password':
        validation = validatePasswordComplexity(value)
        break
      default:
        validation = { valid: true }
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: validation.valid ? '' : validation.error || ''
    }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    
    setTouched({
      name: true,
      age: true,
      employer: true,
      password: true
    })
    
    // Validate all fields
    const validations = {
      name: validateName(form.name),
      age: form.age ? validateAge(form.age) : { valid: true },
      employer: validateEmployer(form.employer),
      password: validatePasswordComplexity(form.password)
    }
    
    const newErrors: Record<string, string> = {}
    Object.entries(validations).forEach(([field, result]) => {
      if (!result.valid && result.error) {
        newErrors[field] = result.error
      }
    })
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      if (!response.ok) throw new Error('Signup failed')
      
      const { token, user } = await response.json()
      localStorage.setItem('authToken', token)
      onAuthed(user)
    } catch (error) {
      console.error(error)
      alert('Signup failed. Please try again.')
    }
  }

  return (
    <form onSubmit={submit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
          Create your account
        </Typography>
        {/* All the different errors */}
        
        {Object.keys(errors).length > 0 && touched.name && touched.password && touched.employer && (
          <Alert severity="error">
            Please correct the errors below before submitting.
          </Alert>
        )}
        
        <TextField
          label="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onBlur={e => handleBlur('name', e.target.value)}
          error={touched.name && !!errors.name}
          helperText={touched.name && errors.name}
          fullWidth
          required
          variant="outlined"
          inputProps={{
            minLength: 2,
            maxLength: 40,
            pattern: "[a-zA-Z][a-zA-Z'-]{1,39}"
          }}
        />
        
        <TextField
          label="Age"
          type="number"
          value={form.age}
          onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
          onBlur={e => handleBlur('age', e.target.value)}
          error={touched.age && !!errors.age}
          helperText={touched.age && errors.age}
          fullWidth
          variant="outlined"
          inputProps={{
            min: 18,
            max: 120
          }}
        />
        
        <TextField
          select
          label="Gender"
          value={form.gender}
          onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
          fullWidth
          variant="outlined"
        >
          <MenuItem value="">Prefer not to say</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Non-binary">Non-binary</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        
        <TextField
          label="Employer / Company"
          value={form.employer}
          onChange={e => setForm(f => ({ ...f, employer: e.target.value }))}
          onBlur={e => handleBlur('employer', e.target.value)}
          error={touched.employer && !!errors.employer}
          helperText={touched.employer && errors.employer}
          fullWidth
          required
          variant="outlined"
          inputProps={{
            minLength: 2,
            maxLength: 100
          }}
        />
        
        <TextField
          label="Passcode"
          type="password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          onBlur={e => handleBlur('password', e.target.value)}
          error={touched.password && !!errors.password}
          helperText={
            touched.password && errors.password 
              ? errors.password 
              : 'Must be 8+ chars with uppercase, lowercase, digit, and special character'
          }
          fullWidth
          required
          variant="outlined"
          inputProps={{
            minLength: 8,
            maxLength: 128
          }}
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          fullWidth
          sx={{ 
            mt: 1,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
            }
          }}
        >
          Create Account
        </Button>

        <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', mt: 1 }}>
          We only store this in your browser for MVP.
        </Typography>
      </Box>
    </form>
  )
}