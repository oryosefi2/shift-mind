function App() {
  console.log('App component is rendering...')
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'lightblue', 
      minHeight: '100vh',
      direction: 'rtl',
      color: 'black',
      fontSize: '20px'
    }}>
      <h1 style={{ 
        color: 'red', 
        fontSize: '32px',
        marginBottom: '20px'
      }}>
        🎉 ShiftMind עובד! 🎉
      </h1>
      <p style={{ 
        backgroundColor: 'yellow', 
        padding: '10px',
        border: '3px solid green',
        marginBottom: '10px'
      }}>
        זהו הדף הראשי של ShiftMind
      </p>
      <p>
        אם אתם רואים את הטקסט הזה, האפליקציה פועלת כהלכה!
      </p>
    </div>
  )
}

export default App
