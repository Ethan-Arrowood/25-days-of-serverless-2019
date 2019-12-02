# Day 2 - Lucy's Dilemma

To solve Day 2 challenge I created an Azure Logic App to send text message reminders to Lucy.

The Logic App is triggered with an initial HTTP POST Request containing Lucy's phone number. 

The body should look like this:
```javascript
{
  "phoneNumber": "+11234567890"
}
```

Once the request is received by the Logic App it will kick off a series of delays and will, in sequence, message the provided phone number the expected reminder messages.

This trigger allows Lucy to use her Logic App whenever she pleases -- all she has to do is send a POST request and she'll start the app. This request could come from an app on her phone, a website, or even another Logic App!

Using a separate Logic App instance, we can set a recurring timer for every year on December 13th at 8:00am to send a POST request containing Lucy's phone number to this Logic App. 