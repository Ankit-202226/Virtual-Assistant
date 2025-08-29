import React, { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
import { IoMenuOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const isSpeakingRef = useRef(null);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const [ham, setham] = useState(false);
  const synth = window.SpeechSynthesis;

  //Logout

  const handleLogOut = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  // Recognition Start

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("Recognition requested to start");
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Start error:", error);
        }
      }
    }
  };
  //Speak
  const speak = (text) => {
    const utterence = new SpeechSynthesisUtterance(text);
    utterence.lang = "hi-IN";
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang === "hi-IN");
    if (hindiVoice) {
      utterence.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterence.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition();
      }, 800);
    };
    synth.cancel();
    synth.speak(utterence);
  };

  //Command handler

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);

    if (type === "google_search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
    if (type === "calculator_open") {
      window.open(`https://www.google.com/search?q=calculator`, "_blank");
    }
    if (type === "instagram_open") {
      window.open(`https://www.instagram.com/`, "_blank");
    }
    if (type === "facebook_open") {
      window.open(`https://www.facebook.com/`, "_blank");
    }
    if (type === "weather-show") {
      window.open(`https://www.google.com/search?q=weather`, "_blank");
    }
    if (type === "youtube_search" || type === "youtube_play") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank"
      );
    }
  };

  //UseEffect

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    let isMounted = true;
    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
          console.log("Recognition requested to start");
        } catch (e) {
          if (e.name !== "InvalidStateError") {
            console.error(e);
          }
        }
      }
    }, 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };
    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);

      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted");
            } catch (e) {
              if (e.name !== "invalidStateError") console.log(e);
            }
          }
        }, 1000); //delay avoids rapid loop
      }
    };

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);

      // Don't restart here, just log
      console.log("Waiting for onend to restart...");
    };

    recognition.onend = () => {
      console.log("Recognition ended");

      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          try {
             isRecognizingRef.current = true;
               setListening(true);
            recognition.start();
            console.log("Recognition restarted in onend");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }, 500); // short delay helps
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();

      if (
        userData?.assistantName &&
        transcript.toLowerCase().includes(userData.assistantName.toLowerCase())
      ) {
        setAiText("");
        setUserText(transcript);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);
        const data = await getGeminiResponse(transcript);
        handleCommand(data);
        setAiText(data.response);
        setUserText("");
      }
    };

    // window.speechSynthesis.onvoicesChanged = ()=>{
    const greeting = new SpeechSynthesisUtterance(
      `Hello ${userData.name},what can I help you with?`
    );
    greeting.lang = "hi-IN";
    // greeting.onend = ()=>{
    //   startTimeout();
    // };
    window.speechSynthesis.speak(greeting);
    // };

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, []);

  //User Interface

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden ">
      <IoMenuOutline
        className="lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]"
        onClick={() => setham(true)}
      />
      <div
        className={`absolute type-0 lg:hidden w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${
          ham ? "translate-x-0" : "translate-x-full"
        } transition-transform`}
      >
        <RxCross2
          className="lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]"
          onClick={() => setham(false)}
        />
        <button
          className="min-w-[100px] h-[45px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] "
          onClick={handleLogOut}
        >
          Log Out
        </button>
        <button
          className="min-w-[100px] h-[45px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] "
          onClick={() => navigate("/customize")}
        >
          Customize Your Assistant
        </button>

        <div className="w-full h-[2px] bg-gray-400"></div>
        <h1 className="text-white font-semibold text-[19px]">History</h1>
        <div className="w-full h-[400] gap-[20px] overflow-y-auto flex flex-col ">
          {userData.history?.map((his) => (
            <span className="text-gray-200 text-[18px] truncate">{his}</span>
          ))}
        </div>
      </div>
      <button
        className="min-w-[100px] h-[45px] mt-[20px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[19px]"
        onClick={handleLogOut}
      >
        Log Out
      </button>

      <button
        className="min-w-[100px] h-[45px] mt-[20px] text-black font-semibold bg-white absolute hidden lg:block top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px]"
        onClick={() => navigate("/customize")}
      >
        Customize Your Assistant
      </button>

      <div className="w-[200px] h-[300px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg">
        <img
          src={userData?.assistantImage}
          alt=""
          className="h-full object-cover"
        />
      </div>
      <h1 className="text-white text-[18px] font-semibold">
        I'm {userData?.assistantName}
      </h1>
      {!aiText && <img src={userImg} alt="" className="w-[150px]" />}
      {aiText && <img src={aiImg} alt="" className="w-[150px]" />}

      <h1 className="text-white text-[18px] font-semibold break-words">
        {userText ? userText : aiText ? aiText : null}
      </h1>
    </div>
  );
}

export default Home;
