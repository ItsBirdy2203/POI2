import React, { useState } from 'react';
import { MessageSimple, useMessageContext } from 'stream-chat-react';
import { scrambleText, unscrambleText } from '../lib/utils.jsx';
import { Lock, Unlock } from 'lucide-react';

const MessageWithBadge = (props) => {
  const { message, user: loggedInUser } = useMessageContext();

  const [isScrambled, setIsScrambled] = useState(false);

  if (!message.user) {
    return <MessageSimple {...props} />;
  }

  const userWithBadge = { ...message.user };
  const taskCount = message.user?.completedTasksCount || 0;
  if (taskCount >= 12) { userWithBadge.name = `⭐⭐⭐ ${message.user.name}`; } 
  else if (taskCount >= 10) { userWithBadge.name = `⭐⭐ ${message.user.name}`; } 
  else if (taskCount >= 5) { userWithBadge.name = `⭐ ${message.user.name}`; }

  const messageToRender = { ...props.message, user: userWithBadge };

  if (isScrambled) {
    messageToRender.text = scrambleText(message.text);
  } else {
    messageToRender.text = unscrambleText(message.text);
  }

  const isMyMessage = message.user.id === loggedInUser?.id;

  return (
    <div className={`flex items-end gap-2 w-full pr-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
      <div className="flex-1">
        <MessageSimple {...props} message={messageToRender} />
      </div>

      {/* CLASES CORREGIDAS PARA QUE EL BOTÓN SIEMPRE SEA VISIBLE */}
      <button
          onClick={() => setIsScrambled(prev => !prev)}
          className="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100"
          title={isScrambled ? "Desencriptar mensaje" : "Encriptar mensaje"}
      >
          {isScrambled ? <Unlock size={14} /> : <Lock size={14} />}
      </button>
    </div>
  );
};

export default MessageWithBadge;