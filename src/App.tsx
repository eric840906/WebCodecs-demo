import { useState, useRef, useEffect } from 'react'
import MP4Box from 'mp4box'
import { Input, Button, Flex, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Select } from '@chakra-ui/react'
import { PlayIcon, PauseIcon } from './assets/Icons'

function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const videoDecoderRef = useRef<VideoDecoder | null>(null)
  const videoEncoderRef = useRef<VideoEncoder | null>(null)
  const audioDecoderRef = useRef<AudioDecoder | null>(null)
  const audioEncoderRef = useRef<AudioEncoder | null>(null)
  const mp4boxVideo = MP4Box.createFile()
  const mp4boxAudio = MP4Box.createFile()
  const getExtradata = () => {
    // 生成VideoDecoder.configure需要的description信息
    const entry = mp4boxVideo.moov.traks[0].mdia.minf.stbl.stsd.entries[0]

    const box = entry.avcC ?? entry.hvcC ?? entry.vpcC
    if (box != null) {
      const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN)
      box.write(stream)
      // slice()方法的作用是移除moov box的header信息
      return new Uint8Array(stream.buffer.slice(8))
    }
  }

  return (
    <Flex flexDir={'column'} gap={5} p={2} w={'100dvw'} h={'100dvh'}>
      <Flex flexDir={'column'} gap={2}>
        <Input type='file' onChange={() => {}} />
        <Button>Transcode avi to mp4</Button>
      </Flex>
      {videoUrl && (
        <Flex>
          <video muted src={videoUrl} onCanPlay={() => {}}></video>
        </Flex>
      )}
    </Flex>
  )
}

export default App
