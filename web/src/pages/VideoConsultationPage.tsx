import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function VideoConsultationPage() {
  const navigate = useNavigate();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      console.error('JitsiMeetExternalAPI not loaded');
      return;
    }

    const roomName = "vpaas-magic-cookie-f98e9839460f456baaaaf29e5fc02b10/SampleAppInfluentialPlaysDemandExpectantly";
    
    const jitsiApi = new window.JitsiMeetExternalAPI("8x8.vc", {
      roomName: roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_POWERED_BY: false,
      }
    });

    jitsiApi.addEventListeners({
      videoConferenceJoined: () => {
        console.log('Joined video conference');
        setIsJoined(true);
      },
      videoConferenceLeft: () => {
        console.log('Left video conference');
        setIsJoined(false);
        navigate('/consultation');
      },
      readyToClose: () => {
        console.log('Ready to close');
        navigate('/consultation');
      }
    });

    setApi(jitsiApi);

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [navigate]);

  const toggleMute = () => {
    if (api) {
      api.executeCommand('toggleAudio');
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (api) {
      api.executeCommand('toggleVideo');
      setIsVideoOff(!isVideoOff);
    }
  };

  const hangUp = () => {
    if (api) {
      api.executeCommand('hangup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200 p-4 dark:bg-gray-900/50 dark:border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/consultation')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Consultation
          </button>
          <h1 className="text-xl font-semibold">Video Consultation</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Video Container */}
      <div className="relative h-[calc(100vh-80px)]">
        <div 
          ref={jitsiContainerRef} 
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        />
        
        {/* Loading State */}
        {!isJoined && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-300">Connecting to doctor...</p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {isJoined && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoOff 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isVideoOff ? <FiVideoOff className="w-5 h-5" /> : <FiVideo className="w-5 h-5" />}
              </button>
              
              <button
                onClick={hangUp}
                className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              >
                <FiPhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connection Info */}
      <div className="absolute top-20 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Connected to 8x8 Video
        </div>
        <p className="text-gray-400 text-xs mt-1">
          Powered by Jitsi Meet
        </p>
      </div>
    </div>
  );
}


