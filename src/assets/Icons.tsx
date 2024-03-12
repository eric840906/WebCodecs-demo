import { createIcon, Icon } from '@chakra-ui/icons'

export const PlayIcon = createIcon({
  displayName: 'PlayIcon',
  viewBox: '0 0 15 18',
  d: 'M15 8.99991L-9.41753e-06 17.6602V0.339654L15 8.99991Z',
})

export const PauseIcon = () => (
  <Icon viewBox='0 0 15 20'>
    <rect width='5' height='20' fill='#D9D9D9' />
    <rect x='10' width='5' height='20' fill='#D9D9D9' />
  </Icon>
)

export const CloseIcon = () => (
  <Icon>
    <path d='M2.55484 1.34775L14.1523 12.9452' stroke='#D9D9D9' stroke-width='2' stroke-linecap='round' />
    <path d='M1.84775 12.9452L13.4452 1.34775' stroke='#D9D9D9' stroke-width='2' stroke-linecap='round' />
  </Icon>
)
