/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCol = app.findCollectionByNameOrId("_pb_users_auth_");

  // Safely cleanup partial creations from previous failed runs
  try { app.delete(app.findCollectionByNameOrId("answers")); } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("questionnaire_responses")); } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("questions")); } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("questionnaires")); } catch(e){}

  // 1. questionnaires
  const questionnaires = new Collection({
    "name": "questionnaires",
    "type": "base",
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'"
  });
  questionnaires.fields.add(new Field({ "name": "title", "type": "text", "required": true }));
  questionnaires.fields.add(new Field({ "name": "description", "type": "text" }));
  questionnaires.fields.add(new Field({ "name": "is_active", "type": "bool" }));
  app.save(questionnaires);

  // 2. questions
  const questions = new Collection({
    "name": "questions",
    "type": "base",
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'"
  });
  questions.fields.add(new Field({
    "name": "questionnaire_id",
    "type": "relation",
    "required": true,
    "collectionId": questionnaires.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  questions.fields.add(new Field({ "name": "title", "type": "text", "required": true }));
  questions.fields.add(new Field({
    "name": "type",
    "type": "select",
    "required": true,
    "maxSelect": 1,
    "values": ["radio", "checkbox", "essay"]
  }));
  questions.fields.add(new Field({ "name": "options", "type": "json" }));
  questions.fields.add(new Field({ "name": "is_required", "type": "bool" }));
  questions.fields.add(new Field({ "name": "order", "type": "number" }));
  app.save(questions);

  // 3. questionnaire_responses
  const responses = new Collection({
    "name": "questionnaire_responses",
    "type": "base",
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.role = 'admin'"
  });
  responses.fields.add(new Field({
    "name": "questionnaire_id",
    "type": "relation",
    "required": true,
    "collectionId": questionnaires.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  responses.fields.add(new Field({
    "name": "user_id",
    "type": "relation",
    "required": true,
    "collectionId": usersCol.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  app.save(responses);

  // 4. answers
  const answers = new Collection({
    "name": "answers",
    "type": "base",
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.role = 'admin'"
  });
  answers.fields.add(new Field({
    "name": "response_id",
    "type": "relation",
    "required": true,
    "collectionId": responses.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  answers.fields.add(new Field({
    "name": "question_id",
    "type": "relation",
    "required": true,
    "collectionId": questions.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  answers.fields.add(new Field({ "name": "value", "type": "json", "required": true }));
  app.save(answers);

}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("answers")); } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("questionnaire_responses")); } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("questions")); } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("questionnaires")); } catch(e){}
});
