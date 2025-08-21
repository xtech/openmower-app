import {Container, Typography} from '@mui/material';
import './globals.css';

export default function Home() {
  return (
    <Container
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Typography variant="h3" component="h1">
        Hello World!
      </Typography>
    </Container>
  );
}
