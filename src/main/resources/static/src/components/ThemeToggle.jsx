
import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import '../styles/theme-toggle.css'

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="theme-switch-wrapper">
      <label className="theme-switch" htmlFor="theme-checkbox">
        <input 
          type="checkbox" 
          id="theme-checkbox" 
          checked={isDark}
          onChange={toggleTheme}
        />
        <div className="slider round"></div>
      </label>
      <em>Dark Mode</em>
    </div>
  )
}
