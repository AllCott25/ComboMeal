        // Tutorial screen - check if Say hi link was touched
        if (typeof tutorialSayHiLinkX !== 'undefined' && 
            Math.abs(touchX - tutorialSayHiLinkX) < tutorialSayHiLinkWidth/2 && 
            Math.abs(touchY - tutorialSayHiLinkY) < tutorialSayHiLinkHeight/2) {
          console.log("Say hi link touched in tutorial screen");
          if (typeof showFeedbackModal === 'function') {
            showFeedbackModal();
            touchHandled = true;
            return false;
          }
        } 