import { useState, useRef, useEffect } from 'react'
import { FrameInfo } from './types/mp4box'
import MP4Box from 'mp4box'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import { Input, Button, Flex } from '@chakra-ui/react'
import { newArrayBuffer } from './types/mp4box'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputVideoUrl, setInputVideoUrl] = useState('')
  const [outputVideoUrl, setOutputVideoUrl] = useState('')
  const [inputBuffer, setInputBuffer] = useState<ArrayBuffer>()
  const [decodeFrameNum, setDecodeFrameNum] = useState(0)
  const [videoTrack, setVideoTrack] = useState<any>()
  const [audioTrack, setAudioTrack] = useState<any>()
  const [totalFrameNum, setTotalFrameNum] = useState(0)
  const [decodeProgress, setDecodeProgress] = useState(0)
  const [convertChunkNum, setConvertChunkNum] = useState(0)
  const [encodeProgress, setEncodeProgress] = useState(0)
  const [audioChunks, setAudioChunks] = useState<any>([])
  const [videoFrames, setVideoFrames] = useState<FrameInfo[]>([])
  const [totalVideoSample, setTotalVideoSample] = useState()
  const [countSample, setCountSample] = useState(0)
  const videoDecoderRef = useRef<VideoDecoder | null>(null)
  const videoEncoderRef = useRef<VideoEncoder | null>(null)
  const audioDecoderRef = useRef<AudioDecoder | null>(null)
  const audioEncoderRef = useRef<AudioEncoder | null>(null)
  const muxerRef = useRef<any | null>(null)
  const mp4boxVideo = MP4Box.createFile()
  const mp4boxAudio = MP4Box.createFile()

  const getExtradata = () => {
    const entry = mp4boxVideo.moov.traks[0].mdia.minf.stbl.stsd.entries[0]

    const box = entry.avcC ?? entry.hvcC ?? entry.vpcC
    if (box != null) {
      const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN)
      box.write(stream)
      // slice()方法的作用是移除moov box的header信息
      return new Uint8Array(stream.buffer.slice(8))
    }
  }

  const videoInputHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    if (target.files) {
      const file = target.files[0]
      const buffer = (await file.arrayBuffer()) as newArrayBuffer
      buffer.fileStart = 0
      setInputBuffer(buffer)
      const inputUrl = URL.createObjectURL(new Blob([buffer], { type: 'video/mp4' }))
      setInputVideoUrl(inputUrl)
      console.log('append')
      mp4boxVideo.appendBuffer(buffer)
      mp4boxVideo.flush()
      mp4boxAudio.appendBuffer(buffer)
      mp4boxAudio.flush()
      setIsProcessing(false)
    }
  }

  const initVideoDecoder = (track) => {
    videoDecoderRef.current = new VideoDecoder({
      output: async (videoFrame) => {
        if (!track.nb_samples) return
        setDecodeFrameNum(decodeFrameNum + 1)
        const progress = (decodeFrameNum / track.nb_samples) * 100
        const img = await createImageBitmap(videoFrame)
        setDecodeProgress(progress)
        // decodeNum.textContent = `${progress === 100 ? progress : progress.toFixed(2)}%`
        const currentFrameInfo = {
          img,
          duration: videoFrame.duration,
          timestamp: videoFrame.timestamp,
        }
        setVideoFrames((prev) => {
          return [...prev, currentFrameInfo]
        })
        videoFrame.close()
      },
      error: (err) => {
        console.error(err)
      },
    })

    videoDecoderRef.current.configure({
      codec: track.codec,
      codedWidth: track.track_width,
      codedHeight: track.track_height,
      description: getExtradata(),
      hardwareAcceleration: 'prefer-software',
    })
  }

  const initVideoEncoder = () => {
    videoEncoderRef.current = new VideoEncoder({
      output: (chunk, meta) => {
        if (!videoTrack.nb_samples) return
        setConvertChunkNum((prev) => prev + 1)
        // const progress = (convertChunkNum / totalVideoSample) * 100
        // convertNum.textContent = `${progress === 100 ? progress : progress.toFixed(2)}%`
        muxerRef.current.addVideoChunk(chunk, meta)
        // convertProgress.style.width = `${progress}%`
        // if (progress === 100) {
        //   convertButton.disabled = false
        // }
      },
      error: (e) => console.error(e),
    })
    videoEncoderRef.current.configure({
      codec: 'avc1.4d4029',
      width: videoTrack.track_width,
      height: videoTrack.track_height,
      bitrate: 1_200_000,
      framerate: 60,
      hardwareAcceleration: 'prefer-software',
    })
  }

  mp4boxVideo.onReady = async (info) => {
    setIsProcessing(true)
    console.log('on video ready')
    console.log(info)
    setVideoTrack(info.videoTracks[0])
    if (!info.videoTracks[0]) return
    setTotalVideoSample(info.videoTracks[0].nb_samples)
    if (info.videoTracks[0] !== null) {
      mp4boxVideo.setExtractionOptions(info.videoTracks[0].id, 'video', {
        nbSamples: info.videoTracks[0].nb_samples,
      })
    }
    mp4boxVideo.onSamples = (trackId, ref, samples) => {
      console.log(trackId)
      if (!info.videoTracks[0]) return
      if (info.videoTracks[0].id === trackId) {
        mp4boxVideo.stop()
        setCountSample((prev) => (prev += samples.length))
        for (const sample of samples) {
          const type = sample.is_sync ? 'key' : 'delta'
          const chunk = new EncodedVideoChunk({
            type,
            timestamp: sample.cts,
            duration: sample.duration,
            data: sample.data.buffer,
          })
          videoDecoderRef?.current?.decode(chunk)
          console.log(chunk)
        }

        if (countSample === totalVideoSample) {
          videoDecoderRef?.current?.flush()
        }
      }
    }
    initVideoDecoder(info.videoTracks[0])
    mp4boxVideo.start()
  }

  mp4boxVideo.onError = (error) => console.error('MP4 parsing error:', error)

  mp4boxAudio.onReady = async (info) => {
    console.log(info)
    setAudioTrack(info.audioTracks[0])
    const audioTrack = info.audioTracks[0]
    // totalAudioSample = audioTrack.nb_samples
    if (audioTrack != null) {
      mp4boxAudio.setExtractionOptions(audioTrack.id, 'audio', {
        nbSamples: audioTrack.nb_samples,
      })
    }

    mp4boxAudio.onError = (error) => console.error('MP4 parsing error:', error)

    mp4boxAudio.onSamples = function (trackId, ref, samples) {
      console.log(trackId)
      if (audioTrack.id === trackId) {
        mp4boxAudio.stop()
        for (const sample of samples) {
          const type = sample.is_sync ? 'key' : 'delta'
          const chunk = new EncodedAudioChunk({
            type,
            timestamp: sample.cts,
            duration: sample.duration,
            data: sample.data,
          })
          setAudioChunks((prev) => {
            return [...prev, chunk]
          })
        }
      }
    }
    mp4boxAudio.start()
  }

  const convert = async () => {
    setIsProcessing(true)
    setConvertChunkNum(0)
    muxerRef.current = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: videoTrack.track_width,
        height: videoTrack.track_height,
      },
      audio: {
        codec: 'aac',
        numberOfChannels: audioTrack.audio.channel_count,
        sampleRate: audioTrack.audio.sample_rate,
      },
      fastStart: 'in-memory',
    })
    initVideoEncoder()
    for (const videoFrame of videoFrames) {
      // const index = videoFrames.indexOf(videoFrame)
      const currentFrame = new VideoFrame(videoFrame.img, {
        timestamp: (videoFrame.timestamp / videoTrack.timescale) * 1e6,
      })
      videoEncoderRef?.current?.encode(currentFrame)
      currentFrame.close()
      // convertProgress.style.width = `${(index * 100) / totalVideoSample}%`
    }

    for (const audioChunk of audioChunks) {
      await muxerRef.current.addAudioChunk(audioChunk, undefined, (audioChunk.timestamp / audioTrack.timescale) * 1e6)
    }
    await videoEncoderRef?.current?.flush()
    muxerRef.current.finalize()

    const { buffer } = muxerRef.current.target // Buffer contains final MP4 file
    console.log(buffer)
    const outputUrl = URL.createObjectURL(new Blob([buffer], { type: 'video/mp4' }))
    setOutputVideoUrl(outputUrl)

    setIsProcessing(false)
  }
  return (
    <Flex flexDir={'column'} gap={5} p={2} w={'100dvw'} h={'100dvh'}>
      <Flex flexDir={'column'} gap={2}>
        <Input type='file' onChange={videoInputHandler} />
        <Button isLoading={isProcessing} onClick={convert}>
          convert
        </Button>
      </Flex>
      {outputVideoUrl && (
        <Flex>
          <video controls muted src={outputVideoUrl} onCanPlay={() => {}}></video>
        </Flex>
      )}
    </Flex>
  )
}

export default App
