document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('new_mail'));
  // By default, load the inbox
  load_mailbox('inbox');
});
// send mail and post data using fetch method
function compose_email(state) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-mail-view').style.display = 'none';
  // Clear out composition fields in case of new mail
  if(state === 'new_mail'){
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#danger').style.display = 'none';
  }
  // submitted 
  document.querySelector('#compose-form').onsubmit = () => {
    // getting mail info
    recipients = document.querySelector('#compose-recipients').value;
    subject = document.querySelector('#compose-subject').value;
    body = document.querySelector('#compose-body').value;
   fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
        })
      }).then(response =>{
        if (response.status == 400) {
          document.querySelector('#danger').style.display = 'block';
        }
        else {
          document.querySelector('#danger').style.display = 'none';
          load_mailbox('sent');   
        }
      });
      return false;
    };
    
  }

// load mail box (sent, inbox, archive) based on parameter
function load_mailbox(mailbox) {
  console.log('inbox loaded');
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-mail-view').style.display = 'none';
  // Show the mailbox name
  emails_view = document.querySelector('#emails-view');
  emails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`).then(response => response.json()).
    then(emails => {
      // create card for each mail and set data using fetch method
      emails.forEach(email => {
        const mail_container = document.createElement('div');
        const mail_body = document.createElement('div');
        const sender = document.createElement('strong');
        const subject = document.createElement('span');
        const timestamp = document.createElement('span');
        timestamp.id = 'timestamp';
        subject.id = 'subject';
        mail_container.dataset.id = email.id;
        emails_view.append(mail_container);
        mail_container.className = 'card';
        mail_body.className = 'card-body';
        mail_container.append(mail_body);
        sender.innerHTML = email.sender;
        subject.innerHTML = email.subject;
        timestamp.innerHTML = email.timestamp;
        mail_body.append(sender, subject, timestamp);
        mail_container.addEventListener('click', () => { load_mail(mail_container.dataset.id) });
        if (email.read) {
          mail_container.style = 'background-color:#D3D3D3;';
        }
      });
    });
}
// show single email
function load_mail(mail_id) {
  console.log(mail_id);
  let arch_btn = document.querySelector('#archive');
  let archive_state;    // determinig if email is archived or not
  fetch(`/emails/${mail_id}`).then(response => response.json())
    .then(email => {
      console.log(email);
      document.querySelector('#mail-from').innerHTML = email.sender;
      document.querySelector('#mail-to').innerHTML = email.recipients;
      document.querySelector('#mail-subject').innerHTML = email.subject;
      document.querySelector('#mail-time').innerHTML = email.timestamp;
      document.querySelector('#mail-body').innerHTML = email.body;
      if (email.sender !== document.querySelector('#current_user').innerHTML) {  // remove archive button from sent mail box
        if (email.archived) {
          arch_btn.innerHTML = 'Unarchive';
          archive_state = false;
        }
        else {
          arch_btn.innerHTML = 'Archive';
          archive_state = true;
        }
      }
      else {
        arch_btn.style.display = 'none';
      }
      document.querySelector('#reply').onclick = () =>{
        document.querySelector('#compose-recipients').value = email.sender;
        if(email.subject.substring(0,3) !== 'Re:'){
        document.querySelector('#compose-subject').value =`Re: ${email.subject}`;
        }
        else{
          document.querySelector('#compose-subject').value =email.subject;
        }
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} Wrote: \n \n${email.body}\n \n ----------------------------------------- \n \n`;
        compose_email('reply_mail');
      }
    });
  // update archive state then show inbox 
  arch_btn.onclick = async () => {
    await fetch(`/emails/${mail_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: archive_state
      })
    });
    load_mailbox('inbox');
  }
  fetch(`/emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  // Show the single mail view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-mail-view').style.display = 'block';
}
